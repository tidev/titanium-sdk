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

	this.name = "iphone_ui";
	this.tests = [
		{name: "iphoneUIAPIs"}
	]

	this.iphoneUIAPIs = function(testRun) {
		valueOf(testRun, Ti.UI.iPhone).shouldNotBeNull();

		finish(testRun);
	}
}
