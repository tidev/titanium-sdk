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

	this.consoleAPI = function(testRun) {
		valueOf(testRun, console).shouldBeObject();
		valueOf(testRun, console.log).shouldBeFunction();
		valueOf(testRun, console.warn).shouldBeFunction();
		valueOf(testRun, console.error).shouldBeFunction();
		valueOf(testRun, console.info).shouldBeFunction();
		valueOf(testRun, console.debug).shouldBeFunction();

		finish(testRun);
	}
}
