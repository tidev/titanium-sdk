
exports.run = function(testRun, valueOf) {
	var a = require('submodule/a');
	var b = require('submodule/b');

	valueOf(testRun, a.foo).shouldBe(b.foo);
	return testRun;
}