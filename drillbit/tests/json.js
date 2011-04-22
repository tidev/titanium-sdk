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
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2955-android-json-intake-inconsistency-compared-to-ios#ticket-2955-10
	booleanType: function() {
		var a = JSON.parse(JSON.stringify([true, false]));
		valueOf(a[0]).shouldBe(true);
		valueOf(a[1]).shouldBe(false);
		
		a = JSON.parse(JSON.stringify(["true", "false"]));
		valueOf(a[0]).shouldBe("true");
		valueOf(a[1]).shouldBe("false");
		
		var o = JSON.parse(JSON.stringify({ b1 : true, b2 : false, o1 : { b3 : true, b4 : false}}));
		valueOf(o.b1).shouldBe(true);
		valueOf(o.b2).shouldBe(false);
		valueOf(o.o1.b3).shouldBe(true);
		valueOf(o.o1.b4).shouldBe(false);
	},

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2614-jsonstringify-failing-for-droid
	wrappedObjects: function() {
		var o = JSON.parse(JSON.stringify({'0':'asf'}));
		valueOf(o[0]).shouldBe('asf');
		
		o = JSON.parse(JSON.stringify(['abc','def']));
		valueOf(o).shouldMatchArray(['abc', 'def']);

		o = JSON.parse(JSON.stringify({'def':'abc'}));
		valueOf(o.def).shouldBe('abc');

		var user ='me';
		var pass = 'mypass';
		var enc = 'encoded';
		var credentials = {'user_name':user,'password':pass,'encryption' : enc};
		o = JSON.parse(JSON.stringify({'0':credentials,'1':'mobile','2':{'name_value_list':{}}}));
		valueOf(o[0]).shouldBeObject();
		valueOf(o[0].user_name).shouldBe(user);
		valueOf(o[0].password).shouldBe(pass);
		valueOf(o[0].encryption).shouldBe(enc);
		valueOf(o[1]).shouldBe('mobile');
		valueOf(o[2]).shouldBeObject();
		valueOf(o[2].name_value_list).shouldBeObject();
	}
})