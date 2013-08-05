
exports.run = function(testRun, valueOf) {
	valueOf(testRun, function() {
		require('submodule/a');//Modified to invalid path to create exception
	}).shouldThrowException();

	return testRun;
}
