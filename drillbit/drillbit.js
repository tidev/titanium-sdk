//
// A simple Drillbit test collector for metrics -- meant to be run from Rhino
//

var File = Packages.java.io.File;


var drillbitTests = {
	total: 0,
	android: 0,
	ios: 0,
	tests: {}
};

// this must be run from inside the drillbit dir
var testsDir = new File("tests");

var platforms = ["android", "iphone"];
var excludes = ["before", "before_all", "after", "after_all", "timeout", "options"];

function describe(name, tests) {
	drillbitTests.tests[name] = [];

	Object.keys(tests).forEach(function(test) {
		if (excludes.indexOf(test) != -1) return;

		drillbitTests.tests[name].push(test);
		drillbitTests.total++;
		if (describe.platform == "android") {
			drillbitTests.android++;
		} else if (describe.platform == "iphone") {
			drillbitTests.ios++;
		} else {
			drillbitTests.android++;
			drillbitTests.ios++;
		}
	});
}

function asyncTest() {}

function readTestFile(file, platform) {
	describe.platform = platform;
	eval(readFile(file.getAbsolutePath(), "UTF-8"));
	describe.platform = null;
}

function readTestDir(dir, platform) {
	new File(dir).list().forEach(function(name) {
		var file = new File(dir, name);
		if (file.isFile() && name.indexOf(".js") != -1) {
			readTestFile(file, platform)
		} else if (file.isDirectory() && name != "Resources") {
			readTestDir(file, name == "android" ? "android" : (name == "iphone" ? "iphone" : platform));
		}
	});
}

readTestDir(testsDir);
print(JSON.stringify(drillbitTests));