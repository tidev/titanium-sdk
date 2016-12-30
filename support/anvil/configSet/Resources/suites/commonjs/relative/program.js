
exports.run = function(testRun, valueOf) {
	// Actual path from root directory("Resources") to relative/submodule -> Resources/suites/commonjs/relative/submodule
	var a = require('./submodule/a');
	var b = require('./submodule/b');

	valueOf(testRun, a.foo).shouldBe(b.foo);
	return testRun;
}