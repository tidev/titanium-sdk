/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.android('Titanium.Android', function () {
	it('currentActivity', function () {
		should(Ti.Android.currentActivity).not.be.undefined();
		should(Ti.Android.currentActivity).be.a.Object();
	});

	it('rootActivity', function () {
		should(Ti.Android.rootActivity).not.be.undefined();
		should(Ti.Android.rootActivity).be.a.Object();
		should(Ti.Android.rootActivity.intent).not.be.undefined();
		should(Ti.Android.rootActivity.intent).be.a.Object();
	});

	it('newintent', function (finish) {
		this.timeout(5000);
		const launchIntent = Ti.App.Android.launchIntent;
		const newIntent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_VIEW,
			data: 'https://www.appcelerator.com',
			packageName: launchIntent.packageName,
			className: launchIntent.className
		});
		newIntent.putExtra('MyBoolean', true);
		newIntent.putExtra('MyDouble', 123.456);
		newIntent.putExtra('MyString', 'Hello World');
		Ti.Android.rootActivity.addEventListener('newintent', function listener(e) {
			try {
				Ti.Android.rootActivity.removeEventListener('newintent', listener);
				function validateIntent(intent) {
					should(intent).be.a.Object();
					should(intent.action).eql(newIntent.action);
					should(intent.data).eql(newIntent.data);
					should(intent.packageName).eql(newIntent.packageName);
					should(intent.className).eql(newIntent.className);
					should(intent.hasExtra('MyBoolean')).be.true();
					should(intent.getBooleanExtra('MyBoolean', false)).eql(true);
					should(intent.hasExtra('MyDouble')).be.true();
					should(intent.getDoubleExtra('MyDouble', 0)).eql(123.456);
					should(intent.hasExtra('MyString')).be.true();
					should(intent.getStringExtra('MyString')).eql('Hello World');
				}
				Ti.API.info('- Validating: e.intent');
				validateIntent(e.intent);
				Ti.API.info('- Validating: Ti.Android.rootActivity.intent');
				validateIntent(Ti.Android.rootActivity.intent);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		Ti.Android.currentActivity.startActivity(newIntent);
	});

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
				should(wasOnCreateCalled).be.true();
				should(wasOnRestartCalled).be.true();
				should(wasOnStartCalled).be.true();
				should(wasOnResumeCalled).be.true();
				should(wasOnPauseCalled).be.true();
				should(wasOnStopCalled).be.true();
				should(wasOnDestroyCalled).be.true();
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
