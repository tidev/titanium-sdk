/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
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
		Tizen = require('tizen');
	}

	// Most of the tests fail due to the Tizen bug:
	// https://bugs.tizen.org/jira/browse/TDIST-148
	this.name = 'websetting';
	this.tests = [
		{name: 'checkWebSetting'}
	];

	this.checkWebSetting = function(testRun) {
		Ti.API.debug('Checking WebSetting object availability.');

		valueOf(testRun, Tizen).shouldBeObject();
		valueOf(testRun, Tizen.WebSetting).shouldBeObject();
		valueOf(testRun, Tizen.WebSetting.setUserAgentString).shouldBeFunction();
		valueOf(testRun, Tizen.WebSetting.removeAllCookies).shouldBeFunction();
		
		finish(testRun);
	}
}
