var LIT = require("../lib/lit.js"),
	fs = require("fs"),

	test_files = fs.readdirSync("./"),

	test_sources = [],
	test_results = [],

	passed = true
;

// collect all the test file sources and results
test_files.forEach(function(file,idx){
	var match;

	if (match = file.match(/(\d+)\.js/)) {
		test_sources[Number(match[1])-1] = fs.readFileSync(file,{ encoding: "utf8" });
	}
	else if (match = file.match(/(\d+)\.result\.js/)) {
		test_results[Number(match[1])-1] = fs.readFileSync(file,{ encoding: "utf8" });
	}
});

console.log("Running test suite...");

// process the test suite
test_sources.forEach(function(source,idx){
	var res = LIT.tokenize(source);

	// if results have already been recorded, check against them
	if (test_results[idx] != null) {
		if (JSON.stringify(res) === test_results[idx]) {
			console.log("Test #" + (idx+1) + ": passed");
		}
		else {
			console.log("Test #" + (idx+1) + ": failed");
			passed = false;
		}
	}
	// otherwise, simply record the results in the proper file
	else {
		console.log("Test #" + (idx+1) + ": skipped, results recorded");
		fs.writeFileSync((idx+1) + ".result.js",JSON.stringify(res),{ encoding: "utf8" });
	}
});

if (passed) {
	console.log("Test suite passed!");
}
else {
	console.log("Test(s) failed.");
	process.exit(1);
}
