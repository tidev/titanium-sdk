
exports.run = function(testRun, valueOf) {
	// Actual path from root directory("Resources") to relative/submodule -> Resources/suites/commonjs/relative/submodule
	var a = require('/suites/commonjs/relative/submodule/a');//Path modified to correct absolute path
	var b = require('/suites/commonjs/relative/submodule/b');//Path modified to correct absolute path

	valueOf(testRun, a.foo).shouldBe(b.foo);
	return testRun;
}