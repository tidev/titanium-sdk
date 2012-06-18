/*
 * Purpose: main file for running tests and suites within harness
 *
 * Description: contains functions and state management used for running suites, tests, handling 
 * results and communicating with driver
 */

var testUtil = require("testUtil");

module.exports = new function() {
	var harnessGlobal;
	var currentSuite;
	var currentTest;
	var testStartTime;

	var resultCallback = function(result, description) {
		if(result == undefined) {
			result = "success";
		}

		harnessGlobal.util.sendData({
			type: "result",
			suite: currentSuite.name,
			test: currentSuite.tests[currentTest].name,
			result: result,
			description: description,
			duration: (new Date().getTime()) - testStartTime
		});
	}

	var setActiveSuite = function(suiteName) {
		currentSuite = require("suites/" + suiteName);

		testUtil.callback = resultCallback;
		currentSuite.init(testUtil);
	}

	this.init = function(arg) {
		harnessGlobal = arg;
	}

	this.connectToDriver = function() {
		if(Ti.Platform.name == "mobileweb") {
			Ti.API.info("connecting to driver...");
			harnessGlobal.util.sendData({type: "connect"});

		} else {
			harnessGlobal.util.connect();
		}
	}

	this.processDriverData = function(data) {
		var elements = data.split("|");

		if(elements[0] == "connect") {
			harnessGlobal.httpHost = elements[1];
			harnessGlobal.httpPort = elements[2];
			harnessGlobal.util.sendData({type: "ready"});

		} else if(elements[0] == "getSuites") {
			var suitesWrapper = {type: "suites", suites: harnessGlobal.suites};
			harnessGlobal.util.sendData(suitesWrapper);

		} else if(elements[0] == "getTests") {
			setActiveSuite(elements[1]);

			var testsWrapper = {type: "tests", tests: currentSuite.tests};
			harnessGlobal.util.sendData(testsWrapper);

		} else if(elements[0] == "run") {
			if(currentSuite.name != elements[1]) {
				setActiveSuite(elements[1]);
			}
			
			for(var i in currentSuite.tests) {
				if(currentSuite.tests[i].name == elements[2]) {
					currentTest = i;
					testStartTime = new Date().getTime();

					Ti.API.info("running suite<" + elements[1] + "> test<" + elements[2] + ">...");
					try {
						testUtil.errorState = false;
						currentSuite[currentSuite.tests[currentTest].name]();

					} catch(e) {
						var exceptionDetails;

						if(e.stack) {
							exceptionDetails = e.stack;

						} else if(e.lineNumber) {
							exceptionDetails = e.lineNumber;

						} else if(e.line) {
							/*
							this is all we can get on iOS which isn't that useful compared to
							an actual trace.  If the error is a test definition issue rather than 
							platform specific bug you should run the test against android for a 
							better trace
							*/
							exceptionDetails = e.line;

						} else {
							exceptionDetails = "unable to get exception details";
						}

						resultCallback("exception", "<" + exceptionDetails + ">");
					}
				}
			}
		}
	}
}
