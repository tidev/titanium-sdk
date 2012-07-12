
exports.run = function(testRun, valueOf) {
	var a = require('submodule/a');
	var b = require('b');

	valueOf(testRun, a.foo().foo).shouldBeExactly(b.foo);

	return testRun;
}