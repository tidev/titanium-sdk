
exports.run = function(testRun, valueOf) {
	valueOf(testRun, function() {
		require('./submodule/a');
	}).shouldThrowException();

	return testRun;
}
