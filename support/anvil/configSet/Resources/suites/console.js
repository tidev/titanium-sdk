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

	this.name = "console";
	this.tests = [
		{name: "consoleAPI"}
	]

	this.consoleAPI = function(testRun) {
		valueOf(testRun, console).shouldBeObject();
		valueOf(testRun, console.log).shouldBeFunction();
		valueOf(testRun, console.warn).shouldBeFunction();
		valueOf(testRun, console.error).shouldBeFunction();
		valueOf(testRun, console.info).shouldBeFunction();
		valueOf(testRun, console.debug).shouldBeFunction();

		finish(testRun);
	}
}
