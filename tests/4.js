/* test #4
 * testing how literalizer works
 */

function foo(a,b) {
	// single line comment
	console.log("Hello",a,b);
	var long_string = "this is a line\
here is another\
	and here is the end";
}

foo("world","!");
