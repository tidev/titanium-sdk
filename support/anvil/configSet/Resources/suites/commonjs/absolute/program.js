
exports.run = function(testRun, valueOf) {
	var a = require('commonjs/absolute/submodule/a');
	var b = require('./b');

	valueOf(testRun, a.foo().foo).shouldBeExactly(b.foo);

	return testRun;
}