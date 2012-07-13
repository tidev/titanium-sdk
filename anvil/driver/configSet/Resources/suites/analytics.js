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
		{name: "addEvent"},
		{name: "featureEvent"},
		{name: "navEvent"},
		{name: "settingsEvent"},
		{name: "timedEvent"},
		{name: "userEvent"}
	]

	//iOS: TIMOB-5014
	//Android: TIMOB-5020
	this.addEvent = function(testRun) {
		valueOf(testRun, function() {
			Ti.Analytics.addEvent();
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.Analytics.addEvent('type');
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.addEvent('adding', 'featureEvent.testButton')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.addEvent('adding', 'featureEvent.testButton', {'events':'adding'})).shouldBeUndefined();

		finish(testRun);
	}

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

	//iOS: TIMOB-4697
	this.settingsEvent = function(testRun) {
		valueOf(testRun, function() {
			Ti.Analytics.settingsEvent();
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.settingsEvent('settingsEvent.testButton')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.settingsEvent('settingsEvent.testButton', {'events':'settings'})).shouldBeUndefined();

		finish(testRun);
	}

	//Android: TIMOB-4642
	this.timedEvent = function(testRun) {
		var startDate = new Date();
		var stopDate = new Date();
		var duration = stopDate - startDate;
		valueOf(testRun, function() {
			Ti.Analytics.timedEvent();
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.Analytics.timedEvent('timedEvent.testButton');
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.Analytics.timedEvent('timedEvent.testButton', startDate);
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate);
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate, duration)).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.timedEvent('timedEvent.testButton', startDate, stopDate, duration, {'events':'timed'})).shouldBeUndefined();

		finish(testRun);
	}

	this.userEvent = function(testRun) {
		valueOf(testRun, function() {
			Ti.Analytics.userEvent();
		}).shouldThrowException();
		valueOf(testRun, Ti.Analytics.userEvent('userEvent.testButton')).shouldBeUndefined();
		valueOf(testRun, Ti.Analytics.userEvent('userEvent.testButton', {'events':'user'})).shouldBeUndefined();

		finish(testRun);
	}
}
