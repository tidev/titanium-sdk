describe("JSON tests", {
	
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1600-android-jsonstringify-incorrectly-handles-dates-including-silently-faiing
	jsonDates: function() {
		// 11/11/11 11:11:11 (CST)
		var date = new Date(1321031471000);
		valueOf(JSON.stringify(date)).shouldBe("\"2011-11-11T17:11:11.000Z\"");
		valueOf(JSON.stringify({time: date})).shouldBe("{\"time\":\"2011-11-11T17:11:11.000Z\"}");
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1976-android-jsonstringify-does-not-preserve-type
	numberTypes: function() {
		valueOf(JSON.stringify(['001', '002'])).shouldBe("[\"001\", \"002\"]");
		valueOf(JSON.stringify([1, 2])).shouldBe("[1, 2]");
	}
})