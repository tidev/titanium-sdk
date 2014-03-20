
exports.run = function(testRun, valueOf) {
	valueOf(testRun, function() {
		require('foo/bar');
	}).shouldThrowException();

	return testRun;
}
