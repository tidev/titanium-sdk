/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
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
	},

	// http://jira.appcelerator.org/browse/TIMOB-4876
	nativePrototypes: function() {
		// general tests to ensure that objects returned
		// from JSON.parse are "real boys"

		// custom prototype functions on system types
		// we can test that these exist on the result of JSON.parse
		Object.prototype.objFunction = function() { return this; }
		Array.prototype.arrayFunction = function() { return this; }
		String.prototype.strFunction = function() { return this; }
		Boolean.prototype.boolFunction = function() { return this; }

		var o = JSON.parse('{"x": "1", "y": [1, 2, 3], "z": true}');

		valueOf(o.hasOwnProperty).shouldBeFunction();
		valueOf(o.propertyIsEnumerable).shouldBeFunction();
		valueOf(o.constructor).shouldBe(Object);
		valueOf(o.objFunction).shouldBeFunction();
		valueOf(o.objFunction()).shouldBeExactly(o);

		var props = ['x', 'y', 'z'];
		props.forEach(function(prop) {
			valueOf(o.hasOwnProperty(prop)).shouldBeTrue();
			valueOf(o.propertyIsEnumerable(prop)).shouldBeTrue();
		});

		valueOf(Object.keys(o)).shouldMatchArray(props);

		var x = o.x;
		valueOf(x).shouldBeString();
		valueOf(x.constructor).shouldBe(String);
		valueOf(x.strFunction).shouldBeFunction();
		valueOf(x.strFunction()).shouldBe('1');

		var y = o.y;
		valueOf(y).shouldBeArray();
		valueOf(y.constructor).shouldBe(Array);
		valueOf(y.arrayFunction).shouldBeFunction();
		valueOf(y.arrayFunction()).shouldBeExactly(y);

		var z = o.z;
		valueOf(z).shouldBeBoolean();
		valueOf(z.constructor).shouldBe(Boolean);
		valueOf(z.boolFunction).shouldBeFunction();
		valueOf(z.boolFunction()).shouldBe(true);
	}
})