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

	this.name = "app";
	this.tests = [
		{name: "test_custom_values"}
	]

	this.test_custom_values = function(testRun) {
		valueOf(testRun, Ti.App.id).shouldBe('org.appcelerator.titanium.testharness');
		valueOf(testRun, Ti.App.name).shouldBe('test_harness');
		valueOf(testRun, Ti.App.version).shouldBe("1.0.1");
		valueOf(testRun, Ti.App.publisher).shouldBe("test publisher");
		valueOf(testRun, Ti.App.url).shouldBe("http://www.test.com");
		valueOf(testRun, Ti.App.description).shouldBe('test description');
		valueOf(testRun, Ti.App.copyright).shouldBe('copyright 2010 test');

		finish(testRun);
	}
}
