module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "titanium";
	this.tests = [
		{name: "buildHash"},
		{name: "userAgent"}
	]

	this.buildHash = function() {
		valueOf(Titanium.buildHash.length).shouldBe(7);

		finish();
	}

	this.userAgent = function() {
		valueOf(Titanium.userAgent).shouldBeString();
		valueOf(Titanium.userAgent.indexOf("Titanium")).shouldBeNumber();

		finish();
	}
}
