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
		// iOS and android have different but equally valid output for stringify
		var str = JSON.stringify(['001', '002']);
		var result = ((str == "[\"001\", \"002\"]") || (str == "[\"001\",\"002\"]"));
		valueOf(result).shouldBe(true);
		
		str = JSON.stringify([1, 2]);
		result = ((str == "[1, 2]") || (str == "[1,2]"));
		valueOf(result).shouldBe(true);
	}
})