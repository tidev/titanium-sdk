/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
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
	var testResult;
	var testReturned;
	var testFinished;
	var resultSent;

	var setResult = function(testRun, result, description) {
		// make sure that the result being set is not obsolete
		var test = currentSuite.tests[currentTest];
		if (!test) {
			return;
		}
		if ((testRun.suiteName != currentSuite.name) || (testRun.testName != test.name)) {
			/*
			we ignore this as it is a possible a known timing issue that can occur sometimes 
			but we have mechanisms in place to deal with this case
			*/
			Ti.API.warn("received out of date test result, ignoring");
			return;
		}

		if (result == undefined) {
			result = "success";
		}

		testResult = {
			type: "result",
			suite: currentSuite.name,
			test: currentSuite.tests[currentTest].name,
			result: result,
			description: description,
			duration: (new Date().getTime()) - testStartTime
		};

		testFinished = true;

		if (testReturned) {
			sendResult();
		}
	};

	var sendResult = function() {
		/*
		due to timing issues, it is possble that we may try and send more than one result back 
		to the driver for a test - this is bad.  check here as a brute force means to catch any 
		timing issues that slip through in this regard
		*/
		if (resultSent) {
			return;
		}
		resultSent = true;

		harnessGlobal.util.sendData(testResult);
	};

	var setActiveSuite = function(suiteName) {
		currentSuite = require("suites/" + suiteName);

		testUtil.callback = setResult;
		currentSuite.init(testUtil);
	};

	this.init = function(arg) {
		harnessGlobal = arg;
	};

	this.connectToDriver = function() {
		var connectMessage = {type: "ready"};
		if (Ti.Platform.name == "mobileweb") {
			Ti.API.info("connecting to driver...");
			harnessGlobal.util.sendData(connectMessage);

		} else {
			Ti.API.info("listening for driver connection...");
			harnessGlobal.util.socketListen(connectMessage);
		}
	};

	this.processDriverData = function(data) {
		var elements = data.split("|");

		if (elements[0] == "getSuites") {
			var suitesWrapper = {type: "suites", suites: harnessGlobal.suites};
			harnessGlobal.util.sendData(suitesWrapper);

		} else if (elements[0] == "getTests") {
			setActiveSuite(elements[1]);

			var testsWrapper = {type: "tests", tests: currentSuite.tests};
			harnessGlobal.util.sendData(testsWrapper);

		} else if (elements[0] == "run") {
			if (currentSuite.name != elements[1]) {
				setActiveSuite(elements[1]);
			}

			for (var i in currentSuite.tests) {
				if (currentSuite.tests[i].name == elements[2]) {
					currentTest = i;
					testStartTime = new Date().getTime();
					testReturned = false;
					testFinished = false;
					resultSent = false;

					/*
					keep a unique scope for the test that can be shared among the utility 
					functions and passed back with the result as a state check to guard against 
					processing obsolete results
					*/
					var testRun = {
						suiteName: currentSuite.name,
						testName: currentSuite.tests[currentTest].name,
						resultSet: false
					};

					Ti.API.info("running suite<" + elements[1] + "> test<" + elements[2] + ">...");
					try {
						currentSuite[currentSuite.tests[currentTest].name](testRun);
						testReturned = true;

						if (testFinished) {
							sendResult();
						}

					} catch(e) {
						var exceptionDetails;

						if (e.stack) {
							exceptionDetails = e.stack;

						} else if (e.lineNumber) {
							exceptionDetails = e.lineNumber;

						} else if (e.line) {
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

						setResult(testRun, "exception", "<" + exceptionDetails + ">");
						sendResult();
					}
				}
			}
		}
	};
};
