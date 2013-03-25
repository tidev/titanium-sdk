/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		Tizen;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		Tizen = require('tizen');
	}

	this.name = 'power';
	this.tests = [
		{name: 'checkPower'},
		{name: 'powerStateListener'}
	]

	this.checkPower  = function(testRun) {
		Ti.API.debug('Checking power object availability.');
		valueOf(testRun, Tizen.Power).shouldBeObject();
		valueOf(testRun, Tizen.Power.request).shouldBeFunction();
		valueOf(testRun, Tizen.Power.release).shouldBeFunction();
		valueOf(testRun, Tizen.Power.screenBrightness).shouldBeNumber();

		valueOf(testRun, (0 <= Tizen.Power.screenBrightness && Tizen.Power.screenBrightness <= 1)).shouldBeTrue();

		valueOf(testRun, function() {
			Tizen.Power.turnScreenOff();
		}).shouldNotThrowException();

		valueOf(testRun, Tizen.Power.isScreenOn()).shouldBeFalse();

		valueOf(testRun, function() {
			Tizen.Power.turnScreenOn();
		}).shouldNotThrowException();

		valueOf(testRun, Tizen.Power.isScreenOn()).shouldBeTrue();

		finish(testRun);
	}	

	this.powerStateListener = function(testRun) {

		function onScreenStateChanged(state) {
			Ti.API.info("Screen state changed from " + state.previousState + " to " + state.changedState);
			Tizen.Power.turnScreenOn();
			finish(testRun);
		}

		valueOf(testRun, function() {
			Tizen.Power.request(Tizen.Power.POWER_RESOURCE_SCREEN, Tizen.Power.POWER_SCREEN_STATE_SCREEN_NORMAL);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			Tizen.Power.turnScreenOn();
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			Tizen.Power.addEventListener('screenStateChanged', onScreenStateChanged);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			Tizen.Power.turnScreenOff();
		}).shouldNotThrowException();
	}
}
