var instrumentation = {
	
	tests: [],
	
	currentTestID: 1,
	
	startTime: (new Date()).getTime(),
	
	startTest: function(name) {
		var newTestID = this.currentTestID++,
			newTest = { 
				testID: newTestID,
				name: name
			};
		this.tests[newTestID] = newTest;
		newTest.startTime = new Date();
		return newTestID;
	},

	stopTest: function(testID, customInformation) {
		if ((testID in this.tests)) {
			var test = this.tests[testID],
				stopTime;
			test.stopTime = new Date();
			test.customInformation = customInformation;
			stopTime = test.stopTime.getTime()
			test.timeSinceLaunch = stopTime - this.startTime;
			return test.duration = test.stopTime.getTime() - test.startTime.getTime();
		}
	},

	issueReports: function() {
		var i,
			tests = this.tests,
			testsLength = tests.length,
			test;
		for (i in tests) {
			test = tests[i];
			if (test.stopTime) {
				console.debug("[INSTRUMENTATION] Test " + (test.name ? "'" + test.name + "'" : i) + " completed in " + test.duration + " ms (" + test.timeSinceLaunch + " ms since app launched)." + 
					(test.customInformation ? " " + (typeof test.customInformation === "object" ? JSON.stringify(test.customInformation) : test.customInformation) : ""));
				tests.splice(tests.indexOf(test),1);
			}
		}
	}
};
instrumentation.appLoadTest = instrumentation.startTest("App Load Time");