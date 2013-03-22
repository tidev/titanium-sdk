/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf,
		reportError;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	}

	this.name = "gesture";
	this.tests = [
		{name: "gestureBasic"}
	]

	this.gestureBasic = function(testRun) {
		valueOf(testRun, Ti.Accelerometer).shouldBeObject();
		valueOf(testRun, Ti.Gesture.landscape).shouldBeBoolean();
		valueOf(testRun, Ti.Gesture.portrait).shouldBeBoolean();
		valueOf(testRun, Ti.Gesture.orientation).shouldBeNumber();

		finish(testRun);
	}
}