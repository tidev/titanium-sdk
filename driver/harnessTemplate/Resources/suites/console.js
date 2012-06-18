module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "console";
	this.tests = [
		{name: "consoleAPI"}
	]

	this.consoleAPI = function() {
		valueOf(console).shouldBeObject();
		valueOf(console.log).shouldBeFunction();
		valueOf(console.warn).shouldBeFunction();
		valueOf(console.error).shouldBeFunction();
		valueOf(console.info).shouldBeFunction();
		valueOf(console.debug).shouldBeFunction();

		finish();
	}
}
