/*! literalizer
	v0.0.1 (c) Kyle Simpson
	MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition) {
	if (typeof module != "undefined" && module.exports) module.exports = definition();
	else if (typeof define == "function" && define.amd) define(definition);
	else context[name] = definition();
})("LIT",this,function definition(name,context) {

	function tokenize(code) {

		function combineGeneralTokens(tokensSlice) {
			var start, end, i, j;

			for (i=0; i<tokensSlice.length; i++) {
				if (tokensSlice[i].type === TOKEN_GENERAL) {
					start = end = i;
					for (j=start+1; j<tokensSlice.length; j++) {
						end = j;
						if (tokensSlice[j].type !== TOKEN_GENERAL) {
							end = j-1;
							break;
						}
					}
					if (end > start) {
						for (j=start+1; j<=end; j++) {
							tokensSlice[start].val += tokensSlice[j].val;
						}
						tokensSlice.splice(start+1,end-start);
					}
					else i = j;
				}
			}

			return tokensSlice;
		}

		function unescapeGeneralTokens(tokensSlice) {
			for (var i=0; i<tokensSlice.length; i++) {
				if (tokensSlice[i].type === TOKEN_GENERAL) {
					tokensSlice[i].val = tokensSlice[i].val.replace(/\\\\/g,"\\");
				}
			}

			return tokensSlice;
		}

		function processGeneral() {
			var tokensSlice;

			// capture preceeding unmatched string, if any
			if (unmatched) {
				token = {
					type: TOKEN_GENERAL,
					val: unmatched
				};
				tokens.push(token);
			}

			if (match) {
				// starting a comment token?
				if (match[0] === "//" || match[0] === "/*") {
					tokens.push({
						type: TOKEN_COMMENT,
						val: match[0]
					});
					if (match[0] === "//") {
						lexing_state = STATE_SINGLE_LINE_COMMENT;
					}
					else {
						lexing_state = STATE_MULTI_LINE_COMMENT;
					}
				}
				// starting a backtick-literal token?
				else if (match[0] === "`") {
					tokens.push({
						type: TOKEN_BACKTICK_LITERAL,
						val: match[0]
					});
					lexing_state = STATE_BACKTICK_LITERAL;
				}
				// starting a string-literal token?
				else if (match[0] === "\"" || match[0] === "'") {
					tokens.push({
						type: TOKEN_STRING_LITERAL,
						val: match[0]
					});
					lexing_state = STATE_STRING_LITERAL;
					state_patterns[STATE_STRING_LITERAL] = new RegExp(match[0],"g");
				}
				// starting a regex-literal token (candidate)?
				// TODO: fix this to ignore / division!!
				else if (match[0] === "/") {
					tokens.push({
						type: TOKEN_REGEX_LITERAL,
						val: match[0]
					});
					lexing_state = STATE_REGEX_LITERAL_CANDIDATE;
				}
			}
			
			// manage the tokens list
			tokens = tokens.concat((tokensSlice = unescapeGeneralTokens(combineGeneralTokens(tokens.splice(token_idx-tokens.length)))));
			token_idx = tokens.length;
		}

		function processSingleLineComment() {
			tokens[tokens.length-1].val += unmatched;
			if (match) {
				// don't capture the new-line in this comment token, leave it for next match
				next_match_idx -= match[0].length;
			}
			lexing_state = STATE_GENERAL;
		}

		function processMultiLineComment() {
			tokens[tokens.length-1].val += unmatched;
			if (match) {
				tokens[tokens.length-1].val += match[0];
			}
			lexing_state = STATE_GENERAL;
		}

		function processStringLiteral() {
			var leftContext;

			tokens[tokens.length-1].val += unmatched;

			if (match) {
				tokens[tokens.length-1].val += match[0];
				leftContext = code.substring(0,next_match_idx - match[0].length);

				// is the match at the beginning or is it NOT escaped?
				if (!leftContext || leftContext.match(not_escaped_pattern)) {
					lexing_state = STATE_GENERAL;
				}
			}
		}

		function processBacktickLiteral() {
			var leftContext;

			tokens[tokens.length-1].val += unmatched;

			if (match) {
				tokens[tokens.length-1].val += match[0];
				leftContext = code.substring(0,next_match_idx - match[0].length);

				// is the match at the beginning or is it NOT escaped?
				if (!leftContext || leftContext.match(not_escaped_pattern)) {
					lexing_state = STATE_GENERAL;
				}
			}
		}

		// TODO: handle regex processing
		function processRegexLiteral() {
		}





		var tokens = [],

			match,
			prev_match_idx = 0,
			next_match_idx = 0,
			token_idx = 0,
			unmatched = "",
			regex,
			token,

			lexing_state = 0,
			lexing_index = 0,

			TOKEN_GENERAL = 0,
			TOKEN_COMMENT = 1,
			TOKEN_STRING_LITERAL = 2,
			TOKEN_BACKTICK_LITERAL = 3,
			TOKEN_REGEX_LITERAL = 4,

			STATE_GENERAL = 0,
			STATE_SINGLE_LINE_COMMENT = 1,
			STATE_MULTI_LINE_COMMENT = 2,
			STATE_STRING_LITERAL = 3,
			STATE_BACKTICK_LITERAL = 4,
			STATE_REGEX_LITERAL_CANDIDATE = 5,

			not_escaped_pattern = /(?:[^\\]|(?:^|[^\\])(?:\\\\)+)$/,

			state_patterns = [
				/\/\/|\/\*|[`\/"']/g,	// general
				/\r?\n/g,				// end of single-line comment
				/\*\//g,					// end of multi-line comment
				null,					// (placeholder) end of string literal
				/[`]/g,					// end of backtick literal
				/(?:\/[img]*)|\r?\n/g	// end of regex
			],

			state_processors = [
				processGeneral,
				processSingleLineComment,
				processMultiLineComment,
				processStringLiteral,
				processBacktickLiteral,
				processRegexLiteral
			]
		;

		if (!code || code.length === 0) return tokens;

		while (next_match_idx < code.length) {
			unmatched = "";

			regex = state_patterns[lexing_state];

			regex.lastIndex = next_match_idx;
			match = regex.exec(code);

			if (match) {
				prev_match_idx = next_match_idx;
				next_match_idx = regex.lastIndex;

				// collect the previous string code not matched before this token
				if (prev_match_idx < next_match_idx - match[0].length) {
					unmatched = code.substring(prev_match_idx,next_match_idx - match[0].length);
				}
			}
			else {
				prev_match_idx = next_match_idx;
				next_match_idx = code.length;
				unmatched = code.substr(prev_match_idx);
				if (!unmatched) break;
			}

			state_processors[lexing_state]();
		}

		return tokens;
	}

	return {
		tokenize: tokenize
	};

});
