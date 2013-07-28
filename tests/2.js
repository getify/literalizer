/* test #2
 * testing "how" literalizer works
 */

function foo(a,b) {
	// single line comment
	console.log("He/*ll*/o",a,b);
}

foo("wo//rld","!");
