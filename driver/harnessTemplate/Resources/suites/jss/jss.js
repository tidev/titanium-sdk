module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "jss";
	this.tests = [
		{name: "platform_jss_dirs"}
	]

	this.platform_jss_dirs = function(testRun) {
		var test = Ti.UI.createView({ id: "test" });
		valueOf(testRun, test).shouldNotBeNull();

		if (Ti.Platform.name == "android") {
			valueOf(testRun, test.backgroundColor).shouldBe("red");
		} else {
			valueOf(testRun, test.backgroundColor).shouldBe("blue");
		}

		finish(testRun);
	}
}
