
exports.run = function(testRun, valueOf) {
	// Actual path from root directory(Resources) to absolute/submodule -> Resources/suites/commonjs/absolute/submodule
	var a = require('/suites/commonjs/absolute/submodule/a');//Path modified to correct absolute path
	var b = require('./b');

	valueOf(testRun, a.foo().foo).shouldBeExactly(b.foo);

	return testRun;
}