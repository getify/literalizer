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
	else if (match = file.match(/(\d+)\.result\.json/)) {
		test_results[Number(match[1])-1] = fs.readFileSync(
			path.join(test_dir,file),
			{ encoding: "utf8" }
		);
	}
});

console.log("Running test suite...");

// process the test suite
test_sources.forEach(function(source,idx){
	var res, error;

	// catch any errors, as some of the tests expect 'em
	try {
		res = LIT.lex(source);
		res = "{\"results\":" + JSON.stringify(res,null,"\t");
	}
	catch (err) {
		res = "{\"error\":" + err.toString();
		if (err.stack) error = err.stack.toString();
		else error = err.toString();
	}

	// include any warnings
	if (LIT.warnings.length > 0) {
		res += ",\"warnings\":" + JSON.stringify(LIT.warnings,null,"\t");
		LIT.reset();
	}

	res += "}";
	res = JSON.stringify(JSON.parse(res),null,"\t");

	// if results have already been recorded, check against them
	if (test_results[idx] != null) {
		if (res === test_results[idx].trim()) {
			console.log("Test #" + (idx+1) + ": passed");
		}
		else {
			console.log("Test #" + (idx+1) + ": failed");
			if (error) {
				console.log(error);
			}
			else {
				console.log("\t" + res);
			}
			passed = false;
		}
	}
	// otherwise, simply record the results in the proper file
	else {
		console.log("Test #" + (idx+1) + ": skipped, results recorded");
		fs.writeFileSync(
			path.join(test_dir,(idx+1) + ".result.json"),
			res,
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
