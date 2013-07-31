/*! literalizer
    v0.0.6-a (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition) {
	if (typeof module != "undefined" && module.exports) module.exports = definition();
	else if (typeof define == "function" && define.amd) define(definition);
	else context[name] = definition();
})("LIT",this,function definition(name,context) {

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

	function tokenize(code) {

		function processGeneral() {
			var tokensSlice, leftContext;

			// capture preceeding unmatched string, if any
			if (unmatched) {
				// can we add to a previous general token?
				if (tokens.length > 0 &&
					tokens[tokens.length-1].type === TOKEN_GENERAL
				) {
					tokens[tokens.length-1].val += unmatched;
				}
				// otherwise, just create a new one
				else {
					tokens.push({
						type: TOKEN_GENERAL,
						val: unmatched
					});
				}
			}

			if (match) {
				leftContext = code.substring(0,next_match_idx - match[0].length);

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
					STATE_PATTERNS[STATE_STRING_LITERAL] = new RegExp(match[0] + "|\r?\n","g");
				}
				// starting a regex-literal token (candidate)?
				// TODO: this probably needs to take into account ASI but doesn't currently
				else if (match[0] === "/") {
					if (!leftContext ||
						(
							leftContext.match(not_escaped_pattern) &&
							leftContext.match(
								/(?:(?:(?:return|throw|delete|in|else|void|typeof|yield)\s+)|(?:[(\[\{+\-*=~!%&,\|;:\?<>]\s*)|(?:\/\s+))$/
							)
						)
					) {
						tokens.push({
							type: TOKEN_REGEX_LITERAL,
							val: match[0]
						});
						lexing_state = STATE_REGEX_LITERAL_CANDIDATE;
					}
					else {
						// can we add to a previous general token?
						if (tokens[tokens.length-1].type === TOKEN_GENERAL) {
							tokens[tokens.length-1].val += match[0];
						}
						// otherwise, just create a new one
						else {
							tokens.push({
								type: TOKEN_GENERAL,
								val: match[0]
							});
						}
					}
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
				lexing_state = STATE_GENERAL;
			}
		}

		function processMultiLineComment() {
			tokens[tokens.length-1].val += unmatched;
			if (match) {
				tokens[tokens.length-1].val += match[0];
				lexing_state = STATE_GENERAL;
			}
		}

		function processStringLiteral() {
			var leftContext;

			tokens[tokens.length-1].val += unmatched;

			if (match) {
				leftContext = code.substring(0,next_match_idx - match[0].length);

				// is the match at the beginning or is it NOT escaped?
				if (!leftContext || leftContext.match(not_escaped_pattern)) {
					// an unescaped new-line in a file's string literal
					// is a syntax error
					if (match[0].match(/\r?\n/)) {
						throw new SyntaxError("Unterminated string literal: " + tokens[tokens.length-1].val);
					}
					else {
						tokens[tokens.length-1].val += match[0];
						lexing_state = STATE_GENERAL;
					}
				}
				else {
					// include an escaped quote character?
					if (match[0] === "\"" || match[0] === "'") {
						tokens[tokens.length-1].val += match[0];
					}
					// omit escaped new-lines including their \ escape character
					else {
						tokens[tokens.length-1].val =
							tokens[tokens.length-1].val.substring(
								0,
								tokens[tokens.length-1].val.length-1
							)
						;
					}
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
			var leftContext;

			tokens[tokens.length-1].val += unmatched;

			if (match) {
				leftContext = code.substring(0,next_match_idx - match[0].length);

				// any new-line in a file's regex literal is a syntax error
				if (match[0].match(/\r?\n/)) {
					throw new SyntaxError("Unterminated regular expression literal: " + tokens[tokens.length-1].val);
				}
				else {
					// is the match at the beginning or is it NOT escaped?
					if (!leftContext || leftContext.match(not_escaped_pattern)) {
						tokens[tokens.length-1].val += match[0];
						lexing_state = STATE_GENERAL;
					}
					// not a regex after all, reset and try to recover lexing
					else {
						next_match_idx -= tokens[tokens.length-1].val.length - match[0].length + 1;
						prev_match_idx = next_match_idx;
						tokens[tokens.length-1] = {
							type: TOKEN_GENERAL,
							val: "/"
						};
					}
				}
			}
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

			STATE_PROCESSORS = [
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

			regex = STATE_PATTERNS[lexing_state];

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

			STATE_PROCESSORS[lexing_state]();
		}

		// did we end in an abnormal state?
		if (lexing_state === STATE_MULTI_LINE_COMMENT) {
			tokens[tokens.length-1].type = TOKEN_GENERAL;
			public_api.warnings.push("Unterminated multi-line comment at end of file");
		}
		else if (lexing_state === STATE_STRING_LITERAL) {
			tokens[tokens.length-1].type = TOKEN_GENERAL;
			public_api.warnings.push("Unterminated string literal at end of file");
		}
		else if (lexing_state === STATE_BACKTICK_LITERAL) {
			tokens[tokens.length-1].type = TOKEN_GENERAL;
			public_api.warnings.push("Unterminated template string at end of file");
		}
		else if (lexing_state === STATE_REGEX_LITERAL_CANDIDATE) {
			tokens[tokens.length-1].type = TOKEN_GENERAL;
			public_api.warnings.push("Unterminated regular expression literal at end of file");
		}

		return combineGeneralTokens(tokens);
	}

	function reset() {
		public_api.warnings.length = 0;
	}


	var TOKEN_GENERAL = 0,
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

		STATE_PATTERNS = [
			/\/\/|\/\*|[`\/"']/g,		// general
			/\r?\n/g,					// end of single-line comment
			/\*\//g,					// end of multi-line comment
			null,						// (placeholder) end of string literal
			/[`]/g,						// end of backtick literal
			/(?:\/[imgyn]*(?=[\s%&\|\)\]\}\\;:,.<>\?]|$))|\r?\n/g	// end of regex
		],

		public_api
	;


	public_api = {
		tokenize: tokenize,
		reset: reset,

		// a list of warnings (if any) from the lexing
		warnings: [],

		// public constants for interpreting token type
		TOKEN: {
			GENERAL: TOKEN_GENERAL,
			COMMENT: TOKEN_COMMENT,
			STRING_LITERAL: TOKEN_STRING_LITERAL,
			BACKTICK_LITERAL: TOKEN_BACKTICK_LITERAL,
			REGEX_LITERAL: TOKEN_REGEX_LITERAL
		}
	};

	return public_api;
});
