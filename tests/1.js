/* test #1
 * testing how literalizer works
 */

function foo(a,b) {
	// single line comment
	console.log("Hello",a,b);
}

foo("world","!");

// let's now test
// HTML-style comment markers

a<!--a
-->a
a-->a
/*a*/-->a
/*a
a*/ /*a*/ -->a