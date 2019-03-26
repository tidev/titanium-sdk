/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.App', function () {
	it.android('pause/resume events', function (finish) {
		this.timeout(5000);
		let wasPauseEventReceived = false;
		let wasResumeEventReceived = false;

		// Handle Ti.App pause/resume events. They happen when app is sent to background/foreground.
		// - "pause" event must be received before "paused" event.
		// - "resume" event must be received before "resumed" event.
		Ti.App.addEventListener('pause', function pauseEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, pauseEventHandler);
			wasPauseEventReceived = true;
		});
		Ti.App.addEventListener('paused', function pausedEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, pausedEventHandler);
			should(wasPauseEventReceived).be.true;
			Ti.Android.currentActivity.startActivity(Ti.App.Android.launchIntent); // Resume this app.
		});
		Ti.App.addEventListener('resume', function resumeEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, resumeEventHandler);
			wasResumeEventReceived = true;
		});
		Ti.App.addEventListener('resumed', function resumedEventHandler(e) {
			Ti.API.info('Received event: ' + e.type);
			Ti.App.removeEventListener(e.type, resumedEventHandler);
			should(wasResumeEventReceived).be.true;
			finish();
		});

		// Navigate to the device's home screen. Equivalent to pressing the "home" button.
		// This should fire this app's "pause" and "paused" events.
		const homeIntent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_MAIN,
		});
		homeIntent.addCategory(Ti.Android.CATEGORY_HOME);
		homeIntent.setFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		Ti.Android.currentActivity.startActivity(homeIntent);
	});
});
