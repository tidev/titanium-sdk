module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "iphone_ui";
	this.tests = [
		{name: "iphoneUIAPIs"}
	]

	this.iphoneUIAPIs = function(testRun) {
		valueOf(testRun, Ti.UI.iPhone).shouldNotBeNull();

		finish(testRun);
	}
}
