module.exports = new function() {
	var name;
	var harnessGlobal;

	this.init = function(suiteName, arg) {
		name = suiteName;
		harnessGlobal = arg;
	}

	this.sendResult = function(testName, result) {
		harnessGlobal.required.util.sendTestResult(name, testName, result);
	}
}
