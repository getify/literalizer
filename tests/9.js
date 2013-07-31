/* test #9
 * testing how literalizer works
 *
*/
var a = /^\/+[^']\/*(?=")(?!\\{3})(?:[0-9\d\D\s\S\w\b\W\B]|$)\//mgiy;
// the "y" flag is nonstandard and in firefox, but should still be tokenized

var b = /¶§†™¡¢∞¡™•¶§¢ª¶•¡¢§¶ª•™§∞¡©ƒ˙¨ßå©ˆå˙∆ß†ƒ\\¨†åƒ§¶∞åª¶ƒ§•†/;

