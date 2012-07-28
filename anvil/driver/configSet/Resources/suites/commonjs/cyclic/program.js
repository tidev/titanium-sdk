
exports.run = function(testRun, valueOf) {
	var a = require('./a');
	var b = require('./b');

	valueOf(testRun, a.a).shouldNotBeUndefined();
	valueOf(testRun, b.b).shouldNotBeUndefined();
	valueOf(testRun, a.a().b).shouldBeExactly(b.b);
	valueOf(testRun, b.b().a).shouldBeExactly(a.a);

	return testRun;
}