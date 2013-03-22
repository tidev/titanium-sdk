
exports.run = function(testRun, valueOf) {
	var a = require('./a');
	var b = require('./b');

	valueOf(testRun, a.a).shouldNotBeUndefined();
	valueOf(testRun, b.b).shouldNotBeUndefined();
	valueOf(testRun, a.a().b).shouldBeExactly(b.b);
	// It fails on Tizen, because b.b() returns "./a" instead of object "a"
	valueOf(testRun, b.b().a).shouldBeExactly(a.a);

	return testRun;
}