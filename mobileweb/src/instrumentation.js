instrumentation = {
	
	tests: [],
	
	counters: {},
	
	currentTestID: 1,
	
	startTime: Date.now(),
	
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
		newTest.startTime = Date.now();
		return newTestID;
	},

	stopTest: function(testID, customInformation) {
		if (this.tests[testID]) {
			var test = this.tests[testID],
				stopTime = test.stopTime = Date.now();
			test.customInformation = customInformation;
			test.timeSinceLaunch = stopTime - this.startTime;
			test.duration = stopTime - test.startTime;
			this.logTest(testID);
		}
	},
	
	logTest: function(testID) {
		var test = this.tests[testID],
			category;
		if (test) {
			category = test.category;
			console.debug("[INSTRUMENTATION] Test " + (category ? "'" + category + " " + this.counters[category] + "'" : testID) + " completed\n" +
				"\tDuration: " + test.duration + " ms\n" +
				"\tTime since app launched: " + test.timeSinceLaunch + " ms" +
				(test.customInformation ? "\n\tMore Info: " + (typeof test.customInformation === "object" ? JSON.stringify(test.customInformation) : test.customInformation) : ""));
		}
	},
	
	cancelTest: function(testID) {
		(this.tests[testID]) && (this.tests[testID] = 0);
	},

	issueReports: function() {
		var tests = this.tests,
			len = tests.length,
			test,
			i = 0;
		for (; i < len; i++) {
			test = tests[i];
			if (test && test.stopTime) {
				this.logTest(i);
				tests[i] = 0;
			}
		}
	}
};
instrumentation.systemLoadTimeTest = instrumentation.startTest("System Load Time");