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

	this.name = "Suite_name";
	this.tests = [
		{name: "krollNamespace"},
		{name: "apiTimeStamp"},
		{name: "loggingArray"},
		{name: "broadcastReceiverApi"}
	];

	//TIMOB-6684
	this.krollNamespace = function(testRun) {
		var x = {};
		valueOf(testRun, x.extend).shouldBeUndefined();

		finish(testRun);
	}

	//TIMOB-11537
	this.apiTimeStamp = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, function() {
				Titanium.API.timestamp('Titanium.API.timestamp');
			}).shouldNotThrowException();

		finish(testRun);
		}else {
			Ti.API.warn("Cross-context tests aren't currently being tested in android");

			finish(testRun);
		}
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

	//TIMOB-10214
	this.broadcastReceiverApi = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun, function() {
				var bc = Ti.Android.createBroadcastReceiver({
					url:'mybroadcast.js'
				});
				Ti.Android.registerBroadcastReceiver(bc, [Ti.Android.ACTION_AIRPLANE_MODE_CHANGED]);
				Ti.Android.unregisterBroadcastReceiver(bc);	
			}).shouldNotThrowException();
			
			finish(testRun);
		}else {
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");

			finish(testRun);
		}
	}
}
