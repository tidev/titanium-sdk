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

	this.name = "analytics";
	this.tests = [
		{name: "featureEvent"},
		{name: "navEvent"},
	]

	this.featureEvent = function(testRun) {
		valueOf(testRun, function() {
			Ti.Analytics.featureEvent();
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.featureEvent('featureEvent.testButton')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.featureEvent('featureEvent.testButton', {'events':'feature'})).shouldBeUndefined();

		finish(testRun);
	}

	this.navEvent = function(testRun) {
		valueOf(testRun, function() {
			Ti.Analytics.navEvent();
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.Analytics.navEvent('here');
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.navEvent('here', 'there')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.navEvent('here', 'there', 'navEvent.testButton')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.navEvent('here', 'there', 'navEvent.testButton', {'events':'nav'})).shouldBeUndefined();

		finish(testRun);
	}

}
