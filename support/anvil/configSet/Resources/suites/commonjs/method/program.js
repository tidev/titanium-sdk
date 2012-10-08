
exports.run = function(runTest, valueOf) {
	var a = require('./a');
	var foo = a.foo;

	valueOf(runTest, a.foo()).shouldBe(a);
	valueOf(foo()).shouldBe((function (){return this})());
	a.set(10);
	valueOf(a.get()).shouldBe(10);

	return runTest;
}

