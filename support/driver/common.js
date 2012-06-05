module.exports = new function() {
	var suites;
	var tests = new Object();
	var currentSuite;
	var currentTest;

	var startSuite = function() {
		return "getTests|" + suites[currentSuite].name;
	}

	var startTest = function() {
		return "run|" + suites[currentSuite].name + "|" + tests[currentSuite][currentTest].name;
	}

	this.processHarnessMessage = function(rawMessage) {
		var self = this;
		var message = eval("(" + rawMessage + ")");
		var messageType = typeof message;
		var responseData = "";

		if(messageType == "string") {
			if(message == "connect") {
				responseData = "connect|" + driverGlobal.driverHost + "|" + driverGlobal.driverPort;

			} else if(message == "ready") {
				responseData = "getSuites";
			}

		} else if(messageType == "object") {
			if(message.type == "suites") {
				suites = message.suites;
				currentSuite = 0;

				return startSuite();

			} else if(message.type == "tests") {
				tests[currentSuite] = message.tests;
				currentTest = 0;

				return startTest();

			} else if(message.type == "result") {
				console.log("suite<" + message.suite + "> test<" + message.test + "> result<" + message.results + ">");

				if(currentTest < (tests[currentSuite].length - 1)) {
					currentTest++;
					return startTest();

				} else {
					console.log("test run finished for suite<" + suites[currentSuite].name + ">");

					if(currentSuite < (suites.length - 1)) {
						currentSuite++;
						return startSuite();

					} else {
						console.log("all suites completed");
						driverGlobal.platform.reset();
					}
				}
			}
		}

		return responseData;
	}
}
