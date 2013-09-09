# literalizer

Specialized JS lexer which applies heuristic rules to identify the complex literals first. These literals cause frustration/complication in any JS "parsing" task, as they are a primary source of context-sensitive grammar.

By applying various heuristic rules during lexing, however, these literals can be identified in a first-pass, leaving everything else alone. This allows subsequent parsing to be significantly less complex, possibly even context-free (regular expressions!), or it allows you to easily find the complex literals and target them for special processing.

## Some Use Cases
1. Syntax highlighting is a far more trivial task with regular expressions if these complex literals are already pre-identified and cannot cause false-matches.

2. Easily search for special meta-commands contained in code comments, such as `// @sourceURL=..`.

3. Find all regular expression literals and pass them through an optimization engine and then replace them with their optimized equivalents.

4. Implement macros or other code pragmas which have to be processed before normal JS parsing can proceed.

5. Parse out certain code patterns for things like dependency injection.

## Relaxed
Another key feature of *literalizer* is that it's a "relaxed" lexer, in that it can run against code which is not strictly valid JS and yet still give a best-effort try. Most of the heuristics *are* based off fundamental language grammar, such as ASI and where and how statements and expressions can appear.

However, as long as your code variations don't change the rules for statements and expressions, many syntax/grammar errors, non-standard keywords/constructs, and other invalidations will still just pass through successfully.

A relaxed lexer is also crucial for tasks like on-the-fly syntax highlighting, which must be able to adjust to not-***yet***-completely-valid code.

## Identified Literals
The (complex) literals that will always be identified are:

* strings (`"` or `'` delimited)
* comments (single-line or multi-line)
* regular expressions
* ES6 template strings (` delimited)

### Optional Literals
There are also [configuration options](#options) that control identification of:

* (default: **on**) HTML-style comment markers (`<!--` and `-->`) as single-line comment delimiters; [more info](http://javascript.spec.whatwg.org/#comment-syntax)
* (default: **off**) number literals, including integer, decimal, octal (ES5/ES6), hex (ES5/ES6), and binary (ES6 only)
* (default: **off**) simple literals (`null`, `Infinity`, etc)

## Options
*literalizer* can be configured to control which of the [optional literals](#optional-literals) are identified explicitly.

* `LIT.opts.overlook_html_comment_markers` (boolean; default: `false`) - If set to `true`, will **overlook** (that is, refuse to recognize) the `<!--` and `-->` HTML-style comment markers as single-line comment delimiters, leaving them instead to be treated as standard JS operator sequences; [more info](http://javascript.spec.whatwg.org/#comment-syntax)

* `LIT.opts.identify_number_literals` (boolean; default: `false`) - If set to `true`, will explicitly identify [number literals](#optional-literals)

* `LIT.opts.identify_simple_literals` (boolean; default: `false`) - If set to `true`, will explicitly identify [simple literals](#optional-literals)

## API
*literalizer*'s API includes:

* `LIT.lex(..)` takes a string of code and returns an array of segments, which each have a `type` property for identifying the segment type, according to [which literal](#identified-literals) (or general text) it represents.

* `LIT.generate(..)` takes an array of segments (as produced by `lex(..)`) and re-generates the source code. This might be useful if you wanted to modify (or add/remove) segments after *literalizer* analysis and then re-compile the code.

* `LIT.reset()` resets the `warnings` list from previous runs of `lex(..)`.

* `LIT.warnings` is an array of any warnings encountered while lexing.

## License
The code and all the documentation are released under the MIT license.

http://getify.mit-license.org/
