
exports.run = function(testRun, valueOf) {
	var a = require('commonjs/relative/submodule/a');
	var b = require('commonjs/relative/submodule/b');

	valueOf(testRun, a.foo).shouldBe(b.foo);
	return testRun;
}