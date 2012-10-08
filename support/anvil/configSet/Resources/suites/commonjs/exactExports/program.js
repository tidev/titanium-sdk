
exports.run = function(testRun, valueOf) {
	var a = require('./a');
	valueOf(testRun, a.program()).shouldBeExactly(exports);

	return testRun;
}