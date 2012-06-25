/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "json";
	this.tests = [
		{name: "jsonDates"},
		{name: "numberTypes"},
		{name: "booleanType"},
		{name: "wrappedObjects"},
		{name: "nativePrototypes"}
	]

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1600-android-jsonstringify-incorrectly-handles-dates-including-silently-faiing
	this.jsonDates = function(testRun) {
		// 11/11/11 11:11:11 (CST)
		var date = new Date(1321031471000);
		valueOf(testRun, JSON.stringify(date)).shouldBe("\"2011-11-11T17:11:11.000Z\"");
		valueOf(testRun, JSON.stringify({time: date})).shouldBe("{\"time\":\"2011-11-11T17:11:11.000Z\"}");

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1976-android-jsonstringify-does-not-preserve-type
	this.numberTypes = function(testRun) {
		// iOS and android have different but equally valid output for stringify
		var str = JSON.stringify(['001', '002']);
		var result = ((str == "[\"001\", \"002\"]") || (str == "[\"001\",\"002\"]"));
		valueOf(testRun, result).shouldBe(true);

		str = JSON.stringify([1, 2]);
		result = ((str == "[1, 2]") || (str == "[1,2]"));
		valueOf(testRun, result).shouldBe(true);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2955-android-json-intake-inconsistency-compared-to-ios#ticket-2955-10
	this.booleanType = function(testRun) {
		var a = JSON.parse(JSON.stringify([true, false]));
		valueOf(testRun, a[0]).shouldBe(true);
		valueOf(testRun, a[1]).shouldBe(false);

		a = JSON.parse(JSON.stringify(["true", "false"]));
		valueOf(testRun, a[0]).shouldBe("true");
		valueOf(testRun, a[1]).shouldBe("false");

		var o = JSON.parse(JSON.stringify({ b1 : true, b2 : false, o1 : { b3 : true, b4 : false}}));
		valueOf(testRun, o.b1).shouldBe(true);
		valueOf(testRun, o.b2).shouldBe(false);
		valueOf(testRun, o.o1.b3).shouldBe(true);
		valueOf(testRun, o.o1.b4).shouldBe(false);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2614-jsonstringify-failing-for-droid
	this.wrappedObjects = function(testRun) {
		var o = JSON.parse(JSON.stringify({'0':'asf'}));
		valueOf(testRun, o[0]).shouldBe('asf');

		o = JSON.parse(JSON.stringify(['abc','def']));
		valueOf(testRun, o).shouldMatchArray(['abc', 'def']);

		o = JSON.parse(JSON.stringify({'def':'abc'}));
		valueOf(testRun, o.def).shouldBe('abc');

		var user ='me';
		var pass = 'mypass';
		var enc = 'encoded';
		var credentials = {'user_name':user,'password':pass,'encryption' : enc};
		o = JSON.parse(JSON.stringify({'0':credentials,'1':'mobile','2':{'name_value_list':{}}}));
		valueOf(testRun, o[0]).shouldBeObject();
		valueOf(testRun, o[0].user_name).shouldBe(user);
		valueOf(testRun, o[0].password).shouldBe(pass);
		valueOf(testRun, o[0].encryption).shouldBe(enc);
		valueOf(testRun, o[1]).shouldBe('mobile');
		valueOf(testRun, o[2]).shouldBeObject();
		valueOf(testRun, o[2].name_value_list).shouldBeObject();

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-4876
	this.nativePrototypes = function(testRun) {
		// general tests to ensure that objects returned
		// from JSON.parse are "real boys"

		// custom prototype functions on system types
		// we can test that these exist on the result of JSON.parse
		Object.prototype.objFunction = function() { return this; }
		Array.prototype.arrayFunction = function() { return this; }
		String.prototype.strFunction = function() { return this; }
		Boolean.prototype.boolFunction = function() { return this; }

		var o = JSON.parse('{"x": "1", "y": [1, 2, 3], "z": true}');

		valueOf(testRun, o.hasOwnProperty).shouldBeFunction();
		valueOf(testRun, o.propertyIsEnumerable).shouldBeFunction();
		valueOf(testRun, o.constructor).shouldBe(Object);
		valueOf(testRun, o.objFunction).shouldBeFunction();
		valueOf(testRun, o.objFunction()).shouldBeExactly(o);

		var props = ['x', 'y', 'z'];
		props.forEach(function(prop) {
			valueOf(testRun, o.hasOwnProperty(prop)).shouldBeTrue();
			valueOf(testRun, o.propertyIsEnumerable(prop)).shouldBeTrue();
		});

		valueOf(testRun, Object.keys(o)).shouldMatchArray(props);

		var x = o.x;
		valueOf(testRun, x).shouldBeString();
		valueOf(testRun, x.constructor).shouldBe(String);
		valueOf(testRun, x.strFunction).shouldBeFunction();
		valueOf(testRun, x.strFunction()).shouldBe('1');

		var y = o.y;
		valueOf(testRun, y).shouldBeArray();
		valueOf(testRun, y.constructor).shouldBe(Array);
		valueOf(testRun, y.arrayFunction).shouldBeFunction();
		valueOf(testRun, y.arrayFunction()).shouldBeExactly(y);

		var z = o.z;
		valueOf(testRun, z).shouldBeBoolean();
		valueOf(testRun, z.constructor).shouldBe(Boolean);
		valueOf(testRun, z.boolFunction).shouldBeFunction();
		valueOf(testRun, z.boolFunction()).shouldBe(true);

		delete Object.prototype.objFunction;
		finish(testRun);
	}
}
