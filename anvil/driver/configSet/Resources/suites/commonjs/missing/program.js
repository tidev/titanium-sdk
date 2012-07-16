
exports.run = function(testRun, valueOf) {
	valueOf(testRun, function() {
		require('bogus')
	}).shouldThrowException();

	return testRun;
}
