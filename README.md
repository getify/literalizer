literalizer
===========

JS tokenizer which ONLY tokenizes complex literals so they can easily be skipped over in other parsing tasks.

The complex literals that will be tokenized are:

* strings (" or ' delimited)
* comments (single-line or multi-line)
* regular expressions
* ES6 template strings (` delimited)

What will be returned is an array of tokens, which will be one of the above types, or a general token for everything else.

Think of this as a first-pass-tokenizer, which tokenizes the complex literals first, so that you can make a second-pass of tokenization/parsing and be able to ignore (aka, skip over) these more troublesome-to-parse constructs.
