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

	this.name = "android";
	this.tests = [
		{name: "androidAPIs"},
		{name: "androidMenu"},
		{name: "jsActivityUrl", timeout: 20000},
		{name: "pendingIntentFlags"},
		{name: "intentFlags"},
		{name: "intentFlagAccessors"},
		{name: "proxyInvocation"}
	]

	this.androidAPIs = function(testRun) {
		valueOf(testRun, Ti.Android).shouldNotBeNull();
		valueOf(testRun, Ti.Android.currentActivity).shouldNotBeNull();

		finish(testRun);
	}

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/1592-android-move-menu-to-tiandroidactivity
	this.androidMenu = function(testRun) {
		var activity = Ti.Android.currentActivity;
		
		valueOf(testRun, activity.onCreateOptionsMenu).shouldBeUndefined();
		activity.onCreateOptionsMenu = function(e) {};
		valueOf(testRun, activity.onCreateOptionsMenu).shouldBeFunction();
		
		valueOf(testRun, activity.onPrepareOptionsMenu).shouldBeUndefined();
		activity.onPrepareOptionsMenu = function(e) {};
		valueOf(testRun, activity.onPrepareOptionsMenu).shouldBeFunction();

		finish(testRun);
	}

	//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2492-android-custom-js-activities-dont-correctly-pre-parse-the-url-attribute
	this.jsActivityUrl = function(testRun) {
		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_MAIN,
			url: 'suites/android/android/jsActivity.js'
		});
		intent.addCategory(Ti.Android.CATEGORY_LAUNCHER);
		Ti.Android.currentActivity.startActivityForResult(intent, function(e) {
			Ti.API.debug(JSON.stringify(e));
			valueOf(testRun, e.resultCode).shouldBe(Ti.Android.RESULT_OK);
			finish(testRun);
		});
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2564-android-expose-pendingintent-flag_-constants-in-android-module
	this.pendingIntentFlags = function(testRun) {
		valueOf(testRun, Ti.Android.FLAG_CANCEL_CURRENT).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_NO_CREATE).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ONE_SHOT).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_UPDATE_CURRENT).shouldBeNumber();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/3248-android-support-intent-flags
	this.intentFlags = function(testRun) {
		valueOf(testRun, Ti.Android.FLAG_GRANT_READ_URI_PERMISSION).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_GRANT_WRITE_URI_PERMISSION).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_DEBUG_LOG_RESOLUTION).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_FROM_BACKGROUND).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_BROUGHT_TO_FRONT).shouldBeNumber();
		//API 11 valueOf(testRun, Ti.Android.FLAG_ACTIVITY_CLEAR_TASK).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_CLEAR_TOP).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_FORWARD_RESULT).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_MULTIPLE_TASK).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_NEW_TASK).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_NO_ANIMATION).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_NO_HISTORY).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_NO_USER_ACTION).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_PREVIOUS_IS_TOP).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_REORDER_TO_FRONT).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_ACTIVITY_SINGLE_TOP).shouldBeNumber();
		//API 11 sconsvalueOf(testRun, Ti.Android.FLAG_ACTIVITY_TASK_ON_HOME).shouldBeNumber();
		valueOf(testRun, Ti.Android.FLAG_RECEIVER_REGISTERED_ONLY).shouldBeNumber();

		finish(testRun);
	}

	this.intentFlagAccessors = function(testRun) {
		var intent = Ti.Android.createIntent({
			action : Ti.Android.ACTION_MAIN,
			flags : Ti.Android.FLAG_ACTIVITY_NEW_TASK
		});
		// Test presence of methods
		valueOf(testRun, intent.getFlags).shouldBeFunction();
		valueOf(testRun, intent.setFlags).shouldBeFunction();
		valueOf(testRun, intent.addFlags).shouldBeFunction();

		// Check flags from create args
		valueOf(testRun, intent.flags).shouldBeNumber();
		valueOf(testRun, intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK);

		intent.flags = Ti.Android.FLAG_ACTIVITY_NO_HISTORY;
		valueOf(testRun, intent.flags).shouldBe(Ti.Android.FLAG_ACTIVITY_NO_HISTORY);

		intent.addFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		valueOf(testRun, intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK + Ti.Android.FLAG_ACTIVITY_NO_HISTORY);

		intent = Ti.Android.createIntent({
			action : Ti.Android.ACTION_MAIN
		});

		valueOf(testRun, intent.flags).shouldBeNumber();
		valueOf(testRun, intent.flags).shouldBe(0);
		intent.setFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		valueOf(testRun, intent.getFlags()).shouldBe(Ti.Android.FLAG_ACTIVITY_NEW_TASK);

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-6928
	this.proxyInvocation = function(testRun) {
		var intent, pending, notification;
		valueOf(testRun, function() {
			intent = Ti.Android.createIntent({
				className:"org.appcelerator.titanium.TiActivity",
				flags: Ti.Android.FLAG_ACTIVITY_CLEAR_TOP | Ti.Android.FLAG_ACTIVITY_SINGLE_TOP,
				packageName:Ti.App.id
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			pending = Ti.Android.createPendingIntent({
				intent: intent,
				flags:Ti.Android.FLAG_UPDATE_CURRENT
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			var notification = Ti.Android.createNotification({
				contentTitle: "hello",
				contentText: "hello",
				when: 0,
				contentIntent: pending,
				icon: Ti.Android.R.drawable.progress_indeterminate_horizontal,
				tickerText: "hello",
				flags: (Ti.Android.FLAG_ONGOING_EVENT | Ti.Android.FLAG_NO_CLEAR)
			});
		}).shouldNotThrowException();

		finish(testRun);
	}

	/*this.options = {
		forceBuild: true
	}*/
}
