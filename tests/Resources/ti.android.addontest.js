/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.android('Titanium.Android', function () {
	it('activity callbacks', function (finish) {
		let wasOnCreateCalled = false;
		let wasOnRestartCalled = false;
		let wasOnStartCalled = false;
		let wasOnResumeCalled = false;
		let wasOnPauseCalled = false;
		let wasOnStopCalled = false;
		let wasOnDestroyCalled = false;

		this.timeout(5000);

		const win = Ti.UI.createWindow();
		win.activity.onCreate = function () {
			wasOnCreateCalled = true;
			win.activity.onCreate = null;
		};
		win.activity.onRestart = function () {
			wasOnRestartCalled = true;
			win.activity.onRestart = null;
			setTimeout(function () {
				// Now that app was resumed from background, test destroy behavior.
				win.close();
			}, 50);
		};
		win.activity.onStart = function () {
			wasOnStartCalled = true;
			win.activity.onStart = null;
		};
		win.activity.onResume = function () {
			wasOnResumeCalled = true;
			win.activity.onResume = null;
		};
		win.activity.onPause = function () {
			wasOnPauseCalled = true;
			win.activity.onPause = null;
		};
		win.activity.onStop = function () {
			wasOnStopCalled = true;
			win.activity.onStop = null;
			setTimeout(function () {
				// App was put into the background. Next, resume it to trigger onRestart() callback.
				Ti.Android.currentActivity.startActivity(Ti.App.Android.launchIntent);
			}, 50);
		};
		win.activity.onDestroy = function () {
			wasOnDestroyCalled = true;
			win.activity.onDestroy = null;
		};
		win.addEventListener('open', function () {
			// Navigate to the device's home screen. Equivalent to pressing the "home" button.
			const homeIntent = Ti.Android.createIntent({
				action: Ti.Android.ACTION_MAIN,
			});
			homeIntent.addCategory(Ti.Android.CATEGORY_HOME);
			homeIntent.flags = Ti.Android.FLAG_ACTIVITY_NEW_TASK;
			Ti.Android.currentActivity.startActivity(homeIntent);
		});
		win.addEventListener('close', function () {
			try {
				should(wasOnCreateCalled).be.true;
				should(wasOnRestartCalled).be.true;
				should(wasOnStartCalled).be.true;
				should(wasOnResumeCalled).be.true;
				should(wasOnPauseCalled).be.true;
				should(wasOnStopCalled).be.true;
				should(wasOnDestroyCalled).be.true;
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
