var fs = require("fs"),
	path = require("path"),

	test_dir = __dirname,
	test_files = fs.readdirSync(test_dir),

	LIT = require(path.resolve(test_dir,"../lib/lit.js")),

	test_sources = [],
	test_results = [],

	passed = true
;

// collect all the test file sources and results
test_files.forEach(function(file,idx){
	var match;

	if (match = file.match(/(\d+)\.js/)) {
		test_sources[Number(match[1])-1] = fs.readFileSync(
			path.join(test_dir,file),
			{ encoding: "utf8" }
		);
	}
	else if (match = file.match(/(\d+)\.result\.js/)) {
		test_results[Number(match[1])-1] = fs.readFileSync(
			path.join(test_dir,file),
			{ encoding: "utf8" }
		);
	}
});

console.log("Running test suite...");

// process the test suite
test_sources.forEach(function(source,idx){
	var res;

	try {
		res = LIT.tokenize(source);
	}
	catch (err) {
		console.log("Test #" + (idx+1) + ": " + err.toString());
		passed = false;
		return;
	}

	// if results have already been recorded, check against them
	if (test_results[idx] != null) {
		if (JSON.stringify(res).trim() === test_results[idx].trim()) {
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
		fs.writeFileSync(
			path.join(test_dir,(idx+1) + ".result.js"),
			JSON.stringify(res),
			{ encoding: "utf8" }
		);
	}
});

if (passed) {
	console.log("Test suite passed!");
}
else {
	console.log("Test(s) failed.");
	process.exit(1);
}
