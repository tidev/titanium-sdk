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

	this.name = "android_notificationmgr";
	this.tests = [
		{name: "moduleReachable"},
		{name: "notifyTest"},
		{name: "cancelTest"},
		{name: "cancelAllTest"}
	]

	this.moduleReachable = function(testRun) {
		// Just tests if the module is even reachable, by referencing its constants
		valueOf(testRun, function() { Ti.Android.NotificationManager.DEFAULT_ALL; }).shouldNotThrowException();
		valueOf(testRun, Ti.Android.NotificationManager.DEFAULT_ALL).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.DEFAULT_LIGHTS).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.DEFAULT_SOUND).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.DEFAULT_VIBRATE).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_AUTO_CANCEL).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_INSISTENT).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_NO_CLEAR).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_ONGOING_EVENT).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_ONLY_ALERT_ONCE).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.FLAG_SHOW_LIGHTS).shouldBeNumber();
		valueOf(testRun, Ti.Android.NotificationManager.STREAM_DEFAULT).shouldBeNumber();

		finish(testRun);
	}

	this.notifyTest = function(testRun) {
		// Create the intent
		var intent = Ti.Android.createIntent({
			packageName: 'com.appcelerator.mobile',
			className: 'com.appcelerator.ApplicationActivity',
			action: 'android.intent.action'
		});
		
		// Create a pending intent from this
		var pending = Ti.Android.createPendingIntent({
			activity: Ti.Android.currentActivity,
			intent: intent,
			type: Ti.Android.PENDING_INTENT_FOR_ACTIVITY,
			flags: 1073741824
		});
		var notification = Titanium.Android.createNotification({
			contentTitle: 'Alarm',
			contentText: 'Text',
			contentIntent: pending
		});
		valueOf(testRun, notification).shouldBeObject();
		valueOf(testRun, Ti.Android.NotificationManager.notify(10, notification)).shouldBeUndefined();
		valueOf(testRun, Ti.Android.NotificationManager.cancel(100)).shouldBeUndefined();

		finish(testRun);
	}

	this.cancelTest = function(testRun) {
		valueOf(testRun, function() { Ti.Android.NotificationManager.cancel("bad"); }).shouldThrowException();
		valueOf(testRun, Ti.Android.NotificationManager.cancel(0)).shouldBeUndefined();

		finish(testRun);
	}

	this.cancelAllTest = function(testRun) {
		valueOf(testRun, Ti.Android.NotificationManager.cancelAll()).shouldBeUndefined();

		finish(testRun);
	}
}
