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

A relaxed lexer is also crucial for tasks like on-the-fly syntax highlighting, which must be able to adjust to not-completely-valid code.

## Complex Literals

The complex literals that will be identified are:

* strings (`"` or `'` delimited)
* comments (single-line or multi-line)
* regular expressions
* ES6 template strings (` delimited)
* Number literals (decimal, octal, hex, binary)

The output of *literalizer* is an array of tokens, which will be one of the above types, or a general-token type for everything else.
