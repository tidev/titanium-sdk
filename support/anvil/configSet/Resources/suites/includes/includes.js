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

	this.name = "includes";
	this.tests = [
		{name: "relativeDown"},
		{name: "slashToRoot"},
		{name: "dotdotSlash"},
		{name: "dotSlash"},
		{name: "lotsOfDots"},
		{name: "simpleRequire"},
		{name: "secondContextRequire"},
		{name: "multipleRequire"},
		{name: "includeFromUrlWindow", timeout: 10000}
	]

	var testval = false;

	this.relativeDown = function(testRun) {
		testval = false;
		valueOf(testRun, function(){
			Ti.include('relative_down.js');
		}).shouldNotThrowException();
		valueOf(testRun, testval).shouldBeTrue();

		finish(testRun);
	}

	this.slashToRoot = function(testRun) {
		testval = false;
		valueOf(testRun, function(){
			Ti.include('l2/l3/slash_to_root.js');
		}).shouldNotThrowException();
		valueOf(testRun, testval).shouldBeTrue();

		finish(testRun);
	}

	this.dotdotSlash = function(testRun) {
		testval = false;
		valueOf(testRun, function(){
			Ti.include('l2/l3/dotdotslash.js');
		}).shouldNotThrowException();
		valueOf(testRun, testval).shouldBeTrue();

		finish(testRun);
	}

	this.dotSlash = function(testRun) {
		testval = false;
		valueOf(testRun, function(){
			Ti.include('./dotslash.js');
		}).shouldNotThrowException();
		valueOf(testRun, testval).shouldBeTrue();

		finish(testRun);
	}

	this.lotsOfDots = function(testRun) {
		testval = false;
		valueOf(testRun, function(){
			Ti.include('l2/../l2/./l3/lotsofdots.js');
		}).shouldNotThrowException();
		valueOf(testRun, testval).shouldBeTrue();

		finish(testRun);
	}

	this.simpleRequire = function(testRun) {
		valueOf(testRun, require).shouldBeFunction();

		var module = require("./module");
		valueOf(testRun, module).shouldBeObject();
		valueOf(testRun, module.message).shouldBe("test required module");

		finish(testRun);
	}

	this.secondContextRequire = function(testRun) {
		var callback = new Object();
		callback.passed = function() {
			finish(testRun);
		};
		callback.failed = function(e) {
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		if(Ti.Platform.osname === 'android'){
			Ti.UI.createWindow({
				url: "win.js",
				anvilCallback: callback
			}).open();
			// see win.js for the code that sets results.
		}
		else
		{
		//This test relies on cross-context function calls.
		//As such, is it even a proper test? Conditioning out
		//iOS in the meantime.
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
			finish(testRun);
		}
	}

	this.multipleRequire = function(testRun) {
		valueOf(testRun, require).shouldBeFunction();

		var module1 = require("counter");
		valueOf(testRun, module1).shouldBeObject();
		valueOf(testRun, module1.increment).shouldBeFunction();
		valueOf(testRun, module1.increment()).shouldBe(1);
		valueOf(testRun, module1.increment()).shouldBe(2);

		var module2 = require("counter");
		valueOf(testRun, module2).shouldBeObject();
		valueOf(testRun, module2.increment).shouldBeFunction();
		valueOf(testRun, module2.increment()).shouldBe(3);

		finish(testRun);
	}

	this.includeFromUrlWindow = function(testRun) {
		// Another cross-context test, will need to enable for iOS later
		if (Ti.Platform.osname === 'android') {
			var win = Ti.UI.createWindow({ url: "window_include.js", passed: false });
			win.addEventListener("open", function(e) {
				valueOf(testRun, win.passed).shouldBeTrue();
				finish(testRun);
			});
			win.open();
		} else {
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
			finish(testRun);
		}
	}
}
