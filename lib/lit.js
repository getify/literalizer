/*! literalizer
    v0.0.7-b (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition) {
	if (typeof module != "undefined" && module.exports) module.exports = definition();
	else if (typeof define == "function" && define.amd) define(definition);
	else context[name] = definition();
})("LIT",this,function definition(name,context) {

	function combineGeneralSegments(segmentsSlice) {
		var start, end, i, j;

		for (i=0; i<segmentsSlice.length; i++) {
			if (segmentsSlice[i].type === SEGMENT_GENERAL) {
				start = end = i;
				for (j=start+1; j<segmentsSlice.length; j++) {
					end = j;
					if (segmentsSlice[j].type !== SEGMENT_GENERAL) {
						end = j-1;
						break;
					}
				}
				if (end > start) {
					for (j=start+1; j<=end; j++) {
						segmentsSlice[start].val += segmentsSlice[j].val;
					}
					segmentsSlice.splice(start+1,end-start);
				}
				else i = j;
			}
		}

		return segmentsSlice;
	}

	function unescapeGeneralSegments(segmentsSlice) {
		for (var i=0; i<segmentsSlice.length; i++) {
			if (segmentsSlice[i].type === SEGMENT_GENERAL) {
				segmentsSlice[i].val = segmentsSlice[i].val.replace(/\\\\/g,"\\");
			}
		}

		return segmentsSlice;
	}

	function tokenize(code) {

		function saveText(text) {
			// can we add to a previous general segment?
			if (segments.length > 0 &&
				segments[segments.length-1].type === SEGMENT_GENERAL
			) {
				segments[segments.length-1].val += text;
			}
			// otherwise, just create a new one
			else {
				segments.push({
					type: SEGMENT_GENERAL,
					val: text
				});
			}
		}

		// TODO: might need to take into account ASI but doesn't currently
		function regexLookback() {

			function isEmptyOrWhitespace(tok) {
				if (
					tok.type === SEGMENT_GENERAL &&
					(
						!tok.val ||
						tok.val.match(/^\s*$/)
					)
				) {
					return true;
				}
				else {
					return false;
				}
			}

			function findPrevNontrivialToken() {
				var tok_idx = tokens.length - 1;

				while (
					tok_idx >= 0 &&
					isEmptyOrWhitespace(tokens[tok_idx])
				) {
					tok_idx--;
				}

				return tok_idx;
			}

			var i, tok_idx = findPrevNontrivialToken(),
				tok = tokens[tok_idx],
				parens_found = 0,
				paren_count = 0,
				brace_count = 0
			;

			if (tok.type === TOKEN_SPECIAL) {
				// is preceeding special-token a ')'?
				if (tok.val === ")") {
					for (i=tok_idx; i>=0; i--) {
						tok = tokens[i];

						// let's skip over empty/whitespace tokens :)
						if (isEmptyOrWhitespace(tok)) {
							continue;
						}

						// special-token to consider?
						if (tok.type === TOKEN_SPECIAL) {
							if (tok.val === ")") {
								// already seen a balanced ( ) pair? abort!
								if (paren_count === 0 && parens_found > 0) {
									return false;
								}
								else {
									paren_count++;
								}
							}
							else if (tok.val === "(") {
								paren_count--;
								parens_found++;

								// parens unbalanced? abort!
								if (paren_count < 0) {
									return false;
								}
							}
							else if (
								parens_found > 0 &&		// found at least one ( ) pair?
								paren_count === 0		// balanced ( ) found thus far?
							) {
								if (tok.val.match(/^(?:if|while|for|with)$/)) {
									return true;
								}
								else {
									return false;
								}
							}
						}
						// any other token after a balanced ( ) pair? abort!
						else if (
							parens_found > 0 &&		// found at least one ( ) pair?
							paren_count === 0		// balanced ( ) found thus far?
						) {
							return false;
						}
					}
				}
				// is preceeding special-token a '}'?
				else if (tok.val === "}") {
					// TODO: check if end of a function-expression?
				}
				// is preceeding special-token a keyword or punctuator/operator?
				else if (tok.val.match(/^(?:\b(?:return|throw|delete|in|else|void|typeof|yield|case|debugger|break|continue)\b|\=\>|[+\-*\/=~!%&,\|;:\?<>\(\{\[])$/)) {
					return true;
				}
			}
			else {
				return false;
			}
		}

		function processGeneral() {
			var segmentsSlice, left_context;

			// capture preceeding unmatched string, if any
			if (unmatched) {
				saveText(unmatched);
				if (tokens[tokens.length-1] !== segments[segments.length-1]) {
					tokens.push({
						type: SEGMENT_GENERAL,
						val: unmatched
					});
				}
			}

			if (match) {
				left_context = code.slice(0,next_match_idx - match[0].length);

				// starting a comment segment?
				if (match[0] === "//" || match[0] === "/*") {
					segments.push({
						type: SEGMENT_COMMENT,
						val: match[0]
					});
					tokens.push(segments[segments.length-1]);

					if (match[0] === "//") {
						lexing_state = STATE_SINGLE_LINE_COMMENT;
					}
					else {
						lexing_state = STATE_MULTI_LINE_COMMENT;
					}
				}
				// starting a backtick-literal segment?
				else if (match[0] === "`") {
					segments.push({
						type: SEGMENT_BACKTICK_LITERAL,
						val: match[0]
					});
					tokens.push(segments[segments.length-1]);

					lexing_state = STATE_BACKTICK_LITERAL;
				}
				// starting a string-literal segment?
				else if (match[0] === "\"" || match[0] === "'") {
					segments.push({
						type: SEGMENT_STRING_LITERAL,
						val: match[0]
					});
					tokens.push(segments[segments.length-1]);

					lexing_state = STATE_STRING_LITERAL;
					STATE_PATTERNS[STATE_STRING_LITERAL] = new RegExp(match[0] + "|\r?\n","g");
				}
				// special token?
				else if (match[0].match(/^(?:\b(?:return|throw|delete|in|else|void|typeof|yield|function|if|while|for|with|case|debugger|break|continue)\b|\=\>|[+\-*=~!%&,\|;:\?<>\(\)\{\}\[\]])$/)) {
					saveText(match[0]);
					tokens.push({
						type: TOKEN_SPECIAL,
						val: match[0]
					});
				}
				// starting a regex-literal segment (candidate)?
				else if (match[0] === "/") {
					if (regexLookback()) {
						segments.push({
							type: SEGMENT_REGEX_LITERAL,
							val: match[0]
						});
						tokens.push(segments[segments.length-1]);

						lexing_state = STATE_REGEX_LITERAL_CANDIDATE;
					}
					else {
						saveText(match[0]);
						tokens.push({
							type: TOKEN_SPECIAL,
							val: match[0]
						});
					}
				}
			}
			
			// manage the segments list
			segments = segments.concat((segmentsSlice = unescapeGeneralSegments(combineGeneralSegments(segments.splice(segment_idx-segments.length)))));
			segment_idx = segments.length;
		}

		function processSingleLineComment() {
			segments[segments.length-1].val += unmatched;
			if (match) {
				// don't capture the new-line in this comment segment, leave it for next match
				next_match_idx -= match[0].length;
				lexing_state = STATE_GENERAL;
			}
		}

		function processMultiLineComment() {
			segments[segments.length-1].val += unmatched;
			if (match) {
				segments[segments.length-1].val += match[0];
				lexing_state = STATE_GENERAL;
			}
		}

		function processStringLiteral() {
			var left_context;

			segments[segments.length-1].val += unmatched;

			if (match) {
				left_context = code.slice(0,next_match_idx - match[0].length);

				// is the match at the beginning or is it NOT escaped?
				if (!left_context || left_context.match(not_escaped_pattern)) {
					// an unescaped new-line in a file's string literal
					// is a syntax error
					if (match[0].match(/\r?\n/)) {
						throw new SyntaxError("Unterminated string literal: " + segments[segments.length-1].val);
					}
					else {
						segments[segments.length-1].val += match[0];
						lexing_state = STATE_GENERAL;
					}
				}
				else {
					// include an escaped quote character?
					if (match[0] === "\"" || match[0] === "'") {
						segments[segments.length-1].val += match[0];
					}
					// omit escaped new-lines including their \ escape character
					else {
						segments[segments.length-1].val =
							segments[segments.length-1].val.slice(
								0,
								segments[segments.length-1].val.length-1
							)
						;
					}
				}
			}
		}

		function processBacktickLiteral() {
			var left_context;

			segments[segments.length-1].val += unmatched;

			if (match) {
				segments[segments.length-1].val += match[0];
				left_context = code.slice(0,next_match_idx - match[0].length);

				// is the match at the beginning or is it NOT escaped?
				if (!left_context || left_context.match(not_escaped_pattern)) {
					lexing_state = STATE_GENERAL;
				}
			}
		}

		// TODO: handle regex processing
		function processRegexLiteral() {
			var left_context;

			segments[segments.length-1].val += unmatched;

			if (match) {
				left_context = code.slice(0,next_match_idx - match[0].length);

				// any new-line in a file's regex literal is a syntax error
				if (match[0].match(/\r?\n/)) {
					throw new SyntaxError("Unterminated regular expression literal: " + segments[segments.length-1].val);
				}
				else {
					// is the match at the beginning or is it NOT escaped?
					if (!left_context || left_context.match(not_escaped_pattern)) {
						segments[segments.length-1].val += match[0];
						lexing_state = STATE_GENERAL;
					}
					// not a regex after all, reset and try to recover lexing
					else {
						next_match_idx -= segments[segments.length-1].val.length - match[0].length + 1;
						prev_match_idx = next_match_idx;
						segments[segments.length-1] = {
							type: SEGMENT_GENERAL,
							val: "/"
						};
					}
				}
			}
		}


		var segments = [],
			tokens = [],

			match,
			prev_match_idx = 0,
			next_match_idx = 0,
			segment_idx = 0,
			unmatched = "",
			regex,
			segment,

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

		if (!code || code.length === 0) return segments;

		while (next_match_idx < code.length) {
			unmatched = "";

			regex = STATE_PATTERNS[lexing_state];

			regex.lastIndex = next_match_idx;
			match = regex.exec(code);

			if (match) {
				prev_match_idx = next_match_idx;
				next_match_idx = regex.lastIndex;

				// collect the previous string code not matched before this segment
				if (prev_match_idx < next_match_idx - match[0].length) {
					unmatched = code.slice(prev_match_idx,next_match_idx - match[0].length);
				}
			}
			else {
				prev_match_idx = next_match_idx;
				next_match_idx = code.length;
				unmatched = code.slice(prev_match_idx);
				if (!unmatched) break;
			}

			STATE_PROCESSORS[lexing_state]();
		}

		// did we end in an abnormal state?
		if (lexing_state === STATE_MULTI_LINE_COMMENT) {
			segments[segments.length-1].type = SEGMENT_GENERAL;
			public_api.warnings.push("Unterminated multi-line comment at end of file");
		}
		else if (lexing_state === STATE_STRING_LITERAL) {
			segments[segments.length-1].type = SEGMENT_GENERAL;
			public_api.warnings.push("Unterminated string literal at end of file");
		}
		else if (lexing_state === STATE_BACKTICK_LITERAL) {
			segments[segments.length-1].type = SEGMENT_GENERAL;
			public_api.warnings.push("Unterminated template string at end of file");
		}
		else if (lexing_state === STATE_REGEX_LITERAL_CANDIDATE) {
			segments[segments.length-1].type = SEGMENT_GENERAL;
			public_api.warnings.push("Unterminated regular expression literal at end of file");
		}

		tokens.length = 0;
		return combineGeneralSegments(segments);
	}

	function reset() {
		public_api.warnings.length = 0;
	}


	var SEGMENT_GENERAL = 0,
		SEGMENT_COMMENT = 1,
		SEGMENT_STRING_LITERAL = 2,
		SEGMENT_BACKTICK_LITERAL = 3,
		SEGMENT_REGEX_LITERAL = 4,

		TOKEN_SPECIAL = 5,

		STATE_GENERAL = 0,
		STATE_SINGLE_LINE_COMMENT = 1,
		STATE_MULTI_LINE_COMMENT = 2,
		STATE_STRING_LITERAL = 3,
		STATE_BACKTICK_LITERAL = 4,
		STATE_REGEX_LITERAL_CANDIDATE = 5,

		not_escaped_pattern = /(?:[^\\]|(?:^|[^\\])(?:\\\\)+)$/,

		STATE_PATTERNS = [
			// general
			/\b(?:return|throw|delete|in|else|void|typeof|yield|function|if|while|for|with|case|debugger|break|continue)\b|\/\/|\/\*|\=\>|[`"'+\-*\/=~!%&,\|;:\?<>\(\)\{\}\[\]]/g,
			/\r?\n/g,						// end of single-line comment
			/\*\//g,						// end of multi-line comment
			null,							// (placeholder) end of string literal
			/[`]/g,							// end of backtick literal
			/(?:\/[imgyn]*(?=[\s%&\|\)\]\}\\;:,.<>\?]|$))|\r?\n/g	// end of regex
		],

		public_api
	;


	public_api = {
		tokenize: tokenize,
		reset: reset,

		// a list of warnings (if any) from the lexing
		warnings: [],

		// public constants for interpreting segment type
		SEGMENT: {
			GENERAL: SEGMENT_GENERAL,
			COMMENT: SEGMENT_COMMENT,
			STRING_LITERAL: SEGMENT_STRING_LITERAL,
			BACKTICK_LITERAL: SEGMENT_BACKTICK_LITERAL,
			REGEX_LITERAL: SEGMENT_REGEX_LITERAL
		}
	};

	return public_api;
});
