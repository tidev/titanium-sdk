
exports.run = function(testRun, valueOf) {
	valueOf(testRun, require('./a/b/c/d').foo()).shouldBe(1);

	return testRun;
}