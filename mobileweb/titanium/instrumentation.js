instrumentation = {
	
	tests: [],
	
	counters: {},
	
	currentTestID: 1,
	
	startTime: (new Date()).getTime(),
	
	startTest: function(category) {
		var newTestID = this.currentTestID++,
			newTest = { 
				testID: newTestID,
				category: category
			};
		this.tests[newTestID] = newTest;
		if (category) {
			!(category in this.counters) && (this.counters[category] = 0);
			this.counters[category]++;
		}
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
			test.duration = test.stopTime.getTime() - test.startTime.getTime();
			this.logTest(testID);
		}
	},
	
	logTest: function(testID) {
		if ((testID in this.tests)) {
			var test = this.tests[testID],
				category = test.category;
			console.debug("[INSTRUMENTATION] Test " + (category ? "'" + category + " " + this.counters[category] + "'" : testID) + " completed\n" +
				"\tDuration: " + test.duration + " ms\n" +
				"\tTime since app launched: " + test.timeSinceLaunch + " ms" +
				(test.customInformation ? "\n\tMore Info: " + (typeof test.customInformation === "object" ? JSON.stringify(test.customInformation) : test.customInformation) : ""));
		}
	},
	
	cancelTest: function(testID) {
		(testID in this.tests) && tests.splice(testID,1);
	},

	issueReports: function() {
		var testID,
			tests = this.tests,
			testsLength = tests.length,
			test;
		for (testID in tests) {
			test = tests[testID];
			if (test.stopTime) {
				this.logTest(testID);
				tests.splice(testID,1);
			}
		}
	}
};
instrumentation.systemLoadTimeTest = instrumentation.startTest("System Load Time");