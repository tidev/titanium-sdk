
exports.run = function(testRun, valueOf) {
	valueOf(testRun, require('./a').foo()).shouldBe(1);

	return testRun;
}