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

	this.name = "kroll";
	this.tests = [
		{name: "tiSanity"},
		{name: "functionSanity"},
		{name: "functionWrap"},
		{name: "customProxyMethods"},
		{name: "customObjects"},
		{name: "varArgs"},
		{name: "arrayMixedTypeAndConstructor"},
		{name: "iteration"},
		{name: "optionalParam"}
	]

	this.tiSanity = function(testRun) {
		valueOf(testRun, Ti).shouldNotBeNull();
		valueOf(testRun, Titanium).shouldNotBeNull();
		valueOf(testRun, Ti).shouldBe(Titanium);

		finish(testRun);
	}

	this.functionSanity = function(testRun) {
		// Titanium API methods should report a typeof 'function'
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2288-drillbit-shouldbefunction-fails-on-proxy-methods
		valueOf(testRun, Ti.API.info).shouldBeFunction();
		valueOf(testRun, Ti.API.debug).shouldBeFunction();

		finish(testRun);
	}

	this.functionWrap = function(testRun) {
		// Make sure functions that get wrapped by Kroll still have a return value
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2221-regression-methods-passed-through-contexts-not-returning-values
		Ti.testFunction = function() {
			return 1+1;
		}
		
		valueOf(testRun, Ti.testFunction).shouldBeFunction();
		
		var result = Ti.testFunction();
		valueOf(testRun, result).shouldBe(2);

		finish(testRun);
	}

	this.customProxyMethods = function(testRun) {
		// You should be able to add custom proxy instance methods and use "this" to refer to the proxy instance
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1005-functions-and-currentwindow-on-android-broken
		
		var x = Ti.Filesystem.getFile("app://app.js");
		x.customMethod = function() {
			return this.getNativePath();
		};
		
		valueOf(testRun, x.customMethod).shouldBeFunction();
		
		var path = x.customMethod();
		valueOf(testRun, path).shouldBe(x.getNativePath());

		finish(testRun);
	}

	this.customObjects = function(testRun) {
		// ensure custom objects work when wrapped/unwrapped by Kroll
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2027-android-weird-behavior-when-setting-custom-sub-properties-on-proxies

		var view = Ti.UI.createView();
		view.customObj = "hello";
		valueOf(testRun, view.customObj).shouldBe("hello");
		view.customObj = {};
		view.customObj.test = "hello";
		valueOf(testRun, view.customObj.test).shouldBe("hello");
		view.customObj = { test: "hello" };
		valueOf(testRun, view.customObj.test).shouldBe("hello");
		
		var X = function() { this.y = 1; };
		X.prototype.getY = function() {
			return this.y;
		};

		var x = new X();
		var row = Ti.UI.createTableViewRow();
		row.x = x;

		valueOf(testRun, x.getY()).shouldBe(1);
		valueOf(testRun, row.x.getY()).shouldBe(1);

		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2204-150-regression-errors-accessing-custom-attributes-off-of-tableviewrow-objects-includes-testcase
		var testDate = new Date();
		var dateObj = {bla:"foo", testDateObj:testDate};
		var noDateObj = {bla:"foo"};

		var row = Ti.UI.createTableViewRow({
		    _dateObj: dateObj,
		    _noDateObj: noDateObj,
		    _testDate: testDate
		});

		valueOf(testRun, row._noDateObj.bla).shouldBe("foo");
		valueOf(testRun, row._dateObj.bla).shouldBe("foo");
		valueOf(testRun, row._dateObj.testDateObj).shouldBe(testDate);
		
		valueOf(testRun, row._testDate.getTime()).shouldBe(testDate.getTime());
		valueOf(testRun, row._testDate).shouldBe(testDate);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2341-android-incorrect-method-parameter-binding-if-first-parameter-is-object-and-a-value-is-passed-for-second-parameter
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2065-android-behavior-change-in-set-row-data-test-case#ticket-2065-5
	this.varArgs = function(testRun) {
		valueOf(testRun, Ti.App.Properties.getList("x.y.z", ["abcdefg"])).shouldMatchArray(["abcdefg"]);
		var tv = Ti.UI.createTableView();
		valueOf(testRun, function() {
			tv.setData([{ title: "test" }], {options: "x"});
		}).shouldNotThrowException();

		finish(testRun);
	}

	this.arrayMixedTypeAndConstructor = function(testRun) {
		valueOf(testRun, function() {
			Ti.a = ["abc", "def", 123];
		}).shouldNotThrowException();

		valueOf(testRun, Ti.a[0]).shouldBe("abc");
		valueOf(testRun, Ti.a[1]).shouldBe("def");
		valueOf(testRun, Ti.a[2]).shouldBe(123);

		Ti.x = [1, 2, 3, 4, 5];
		valueOf(testRun, Ti.x.constructor).shouldNotBeUndefined();
		valueOf(testRun, Ti.x.constructor.toString()).shouldContain("Array");

		finish(testRun);
	}

	this.iteration = function(testRun) {
		// Function that simulates "x in ['a','b','c']"
		function oc(a)
		{
		  if (a == undefined || a == null) {
			return {};
		  }
		  var o = {};
		  for(var i=0;i<a.length;i++)
		  {
			o[a[i]]='';
		  }
		  return o;
		}
	
		// Iteration over native JS objects
		var x = {a:'b', b:'c', c:'d'};
		var results = {}
		
		var i = 0;
		for (var y in x) {
			valueOf(testRun, y in oc(Object.keys(x))).shouldBeTrue();
			// JS spec specifies x in y returns keys in the same order as
			// Object.keys()
			valueOf(testRun, y).shouldBe(Object.keys(x)[i]);
			results[x[y]] = y;
			i++;
		}
		valueOf(testRun, i).shouldBe(Object.keys(x).length);
		// Perform a reverse lookup to check we got the right values
		valueOf(testRun, results['b']).shouldBe('a');
		valueOf(testRun, results['c']).shouldBe('b');
		valueOf(testRun, results['d']).shouldBe('c');
		
		// Iteration over proxies, including custom props & props
		// we know are KVC on iOS. Note that we MAY, on proxies, have
		// additional values which were not defined by the user.
		var b = Ti.UI.createButton({
			title:'xyz',
			backgroundImage:'foo.jpg',
			custom:'sup'
		});

		var bKeys = Object.keys(b);
		for (i = 0; i < bKeys.length; i++) {
			var key = bKeys[i];
			valueOf(testRun, key in b).shouldBeTrue();
			results[b[key]] = key;
		}

		valueOf(testRun, i).shouldBe(bKeys.length);
		// Only check the values we explicitly set; other values
		// retrieved are gravy
		valueOf(testRun, results['xyz']).shouldBe('title');
		valueOf(testRun, results['foo.jpg']).shouldBe('backgroundImage');
		valueOf(testRun, results['sup']).shouldBe('custom');

		finish(testRun);
	}


	//TIMOB-5240
	this.optionalParam = function(testRun) {
		function getList(name, value) {
			return Titanium.App.Properties.getList(name, value);
		}
		valueOf(testRun, function() {
			getList("key", "value");
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			getList("key");
		}).shouldNotThrowException();
		//TIMOB-5276
		valueOf(testRun, getList("key")).shouldBeNull();

		finish(testRun);
	}
}
