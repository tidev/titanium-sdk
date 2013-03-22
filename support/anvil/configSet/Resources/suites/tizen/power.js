/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf,
		powerObj;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
		powerObj = require('Ti/Tizen/Power');
	}

	this.name = 'power';
	this.tests = [
		{name: 'checkPower'},
		{name: 'powerStateListener'}
	]

	this.checkPower  = function(testRun) {
		Ti.API.debug('Checking power object availability.');
		valueOf(testRun, powerObj).shouldBeObject();
		valueOf(testRun, powerObj.request).shouldBeFunction();
		valueOf(testRun, powerObj.release).shouldBeFunction();
		finish(testRun);
	}
	

	this.powerStateListener = function(testRun) {

		function onScreenStateChanged(state) {
			Ti.API.info("Screen state changed from " + state.previousState + " to " + state.changedState);
			powerObj.turnScreenOn();
			finish(testRun);
		}

		valueOf(testRun, function() {
			powerObj.request(powerObj.POWER_RESOURCE_SCREEN, powerObj.POWER_SCREEN_STATE_SCREEN_NORMAL);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			powerObj.turnScreenOn();
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			powerObj.addEventListener('screenStateChanged', onScreenStateChanged);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			powerObj.turnScreenOff();
		}).shouldNotThrowException();
	}
}
