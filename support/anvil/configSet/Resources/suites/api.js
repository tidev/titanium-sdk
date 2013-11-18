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

	this.name = "api";
	this.tests = [
		{name: "apiTimeStamp"},
		{name: "loggingArray"}
	]

	//TIMOB-11537
	this.apiTimeStamp = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, function() {
				Titanium.API.timestamp('Titanium.API.timestamp');
			}).shouldNotThrowException();
		}
		finish(testRun);
	}

	//TIMOB-7624
	this.loggingArray = function(testRun) {
		valueOf(testRun, function() {
			Ti.API.info('yo', 'word');
			Ti.API.debug('durp');
			Ti.API.warn('foo', 'bar', 'baz');
			Ti.API.log('level', 'message', 'goes', 'here');
			Ti.API.info();
		}).shouldNotThrowException();

		finish(testRun);
	}
}