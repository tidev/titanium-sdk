module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "android_platform";
	this.tests = [
		{name: "localeString"}
	]

	this.localeString = function(testRun) {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2333
		var locale = Ti.Platform.locale;
		valueOf(testRun, locale.length >= 4).shouldBe(true);
		valueOf(testRun, locale.charAt(2)).shouldBe("-");

		finish(testRun);
	}
}
