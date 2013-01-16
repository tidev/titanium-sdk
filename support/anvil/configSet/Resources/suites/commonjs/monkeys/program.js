
exports.run = function(testRun, valueOf) {
	var a = require('./a');

	valueOf(testRun, exports.monkey).shouldBe(10);

	return testRun;
}