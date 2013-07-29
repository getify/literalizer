literalizer
===========

JS tokenizer which ONLY tokenizes complex literals so they can easily be skipped over in other parsing tasks.

The complex literals that will be tokenized are:

* strings (" or ' delimited)
* comments (single-line or multi-line)
* regular expressions
* ES6 template strings (` delimited)

What will be returned is an array of tokens, which will be one of the above types, or a general token for everything else.

Think of this as a first-pass-tokenizer, which tokenizes the complex literals first, so that you can make a second-pass of tokenization/parsing and be able to target or ignore (aka, skip over) these more troublesome-to-parse constructs.

Usually the contents of these complex literals don't actually need to be parsed, but they often can confuse other parsing by giving false-positives. *literalizer* helps identify these complex literals so they can either be ignored, or so that you can find specific literals that do need further lexing/parsing.
