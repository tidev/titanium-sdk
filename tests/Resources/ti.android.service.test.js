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

describe.android('Titanium.Android.Service', function () {
	it('#startService()', function () {
		should(Ti.Android.startService).not.be.undefined();
		should(Ti.Android.startService).be.a.Function();
	});

	it('#stopService()', function () {
		should(Ti.Android.stopService).not.be.undefined();
		should(Ti.Android.stopService).be.a.Function();
	});

	it('#createService()', function () {
		should(Ti.Android.createService).not.be.undefined();
		should(Ti.Android.createService).be.a.Function();
	});

	it('startService-background-normal', function (finish) {
		var intent;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		Ti.App.addEventListener('service.normal:executed', function appEventHandler(e) {
			Ti.App.removeEventListener(e.type, appEventHandler);
			Ti.Android.stopService(intent);
			finish();
		});
		Ti.Android.startService(intent);
	});

	it('startService-background-interval', function (finish) {
		var intent,
			elapseCount = 3,
			elapseInterval = 1000,
			totalDuration = (elapseCount - 1) * elapseInterval,
			startTime = Date.now();
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.interval.js',
		});
		intent.putExtra('interval', elapseInterval);
		Ti.App.addEventListener('service.interval:executed', function appEventHandler(e) {
			elapseCount--;
			if (elapseCount <= 0) {
				Ti.App.removeEventListener(e.type, appEventHandler);
				Ti.Android.stopService(intent);
				should(Date.now() - startTime).not.be.lessThan(totalDuration);
				finish();
			}
		});
		Ti.Android.startService(intent);
	});

	it('createService-background-normal', function (finish) {
		var intent,
			service,
			appEventHandler,
			wasStartReceived = false,
			wasResumeReceived = false,
			wasServiceExecuted = false,
			wasPauseReceived = false,
			wasStopReceived = false;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		service = Ti.Android.createService(intent);
		service.addEventListener('start', function (e) { // eslint-disable-line no-unused-vars
			// The 'start' event must be fired first and only once.
			should(wasStartReceived).be.eql(false);
			should(wasResumeReceived).be.eql(false);
			should(wasPauseReceived).be.eql(false);
			should(wasStopReceived).be.eql(false);
			wasStartReceived = true;
		});
		service.addEventListener('resume', function (e) { // eslint-disable-line no-unused-vars
			// The 'resume' event must be fired second and only once.
			should(wasStartReceived).be.be.true();
			should(wasResumeReceived).be.eql(false);
			should(wasPauseReceived).be.eql(false);
			should(wasStopReceived).be.eql(false);
			wasResumeReceived = true;
		});
		appEventHandler = function (e) { // eslint-disable-line no-unused-vars
			// The service script must only be executed once.
			should(wasServiceExecuted).be.eql(false);
			wasServiceExecuted = true;
		};
		Ti.App.addEventListener('service.normal:executed', appEventHandler);
		service.addEventListener('pause', function (e) { // eslint-disable-line no-unused-vars
			// The 'pause' event must be fired third and only once.
			should(wasStartReceived).be.be.true();
			should(wasResumeReceived).be.be.true();
			should(wasPauseReceived).be.eql(false);
			should(wasStopReceived).be.eql(false);
			wasPauseReceived = true;
		});
		service.addEventListener('stop', function (e) { // eslint-disable-line no-unused-vars
			// The 'stop' event must be fired last and only once.
			should(wasStartReceived).be.be.true();
			should(wasResumeReceived).be.be.true();
			should(wasPauseReceived).be.be.true();
			should(wasStopReceived).be.eql(false);
			wasStopReceived = true;

			// Verify service script was executed.
			should(wasServiceExecuted).be.be.true();

			// Stop the service.
			Ti.App.removeEventListener('service.normal:executed', appEventHandler);
			service.stop();
			finish();
		});
		service.start();
	});

	it('createService-background-interval', function (finish) {
		var intent,
			service,
			appEventHandler,
			wasStartReceived = false,
			wasResumeReceived = false,
			wasPauseReceived = false,
			wasStopReceived = false,
			resumeCount = 0,
			executeCount = 0,
			pauseCount = 0,
			maxCount = 3,
			interval = 1000,
			totalDuration = (maxCount - 1) * interval,
			startTime = Date.now();
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.interval.js',
		});
		intent.putExtra('interval', interval);
		service = Ti.Android.createService(intent);
		service.addEventListener('start', function (e) { // eslint-disable-line no-unused-vars
			// The 'start' event must be fired first and only once.
			should(wasStartReceived).be.eql(false);
			should(wasResumeReceived).be.eql(false);
			should(wasPauseReceived).be.eql(false);
			should(wasStopReceived).be.eql(false);
			wasStartReceived = true;
		});
		service.addEventListener('resume', function (e) { // eslint-disable-line no-unused-vars
			// The 'resume' event must be fired second.
			if (!wasResumeReceived) {
				should(wasStartReceived).be.be.true();
				wasResumeReceived = true;
				should(wasPauseReceived).be.eql(false);
				should(wasStopReceived).be.eql(false);
			}
			resumeCount++;
		});
		appEventHandler = function (e) { // eslint-disable-line no-unused-vars
			executeCount++;
		};
		Ti.App.addEventListener('service.interval:executed', appEventHandler);
		service.addEventListener('pause', function (e) { // eslint-disable-line no-unused-vars
			// The 'pause' event must be fired third.
			if (!wasPauseReceived) {
				should(wasStartReceived).be.be.true();
				should(wasResumeReceived).be.be.true();
				wasPauseReceived = true;
				should(wasStopReceived).be.eql(false);
			}
			pauseCount++;

			// Stop the service once we've reach the desired elapse count.
			if (executeCount >= maxCount) {
				service.stop();
				should(Date.now() - startTime).not.be.lessThan(totalDuration);
			}
		});
		service.addEventListener('stop', function (e) { // eslint-disable-line no-unused-vars
			// The 'stop' event must be fired last and only once.
			should(wasStartReceived).be.be.true();
			should(wasResumeReceived).be.be.true();
			should(wasPauseReceived).be.be.true();
			should(wasStopReceived).be.eql(false);
			wasStopReceived = true;

			// Verify pause/execute/resume events were fired the same amount of times.
			should(pauseCount).be.eql(maxCount);
			should(executeCount).be.eql(maxCount);
			should(resumeCount).be.eql(maxCount);
			Ti.App.removeEventListener('service.interval:executed', appEventHandler);
			finish();
		});
		service.start();
	});

	it('service-self-stopping-with-intent', function (finish) {
		var intent;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		intent.putExtra('doStopWithIntent', true);
		Ti.App.addEventListener('service.normal:stopped', function appEventHandler(e) {
			Ti.App.removeEventListener(e.type, appEventHandler);
			finish();
		});
		Ti.Android.startService(intent);
	});

	it('service-self-stopping-with-proxy', function (finish) {
		var intent,
			service;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		intent.putExtra('doSelfStop', true);
		Ti.App.addEventListener('service.normal:stopped', function appEventHandler(e) {
			Ti.App.removeEventListener(e.type, appEventHandler);
			finish();
		});
		service = Ti.Android.createService(intent);
		service.start();
	});

	it('startService-foreground-normal', function (finish) {
		var intent;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		intent.putExtra('foregroundNotificationId', 100);
		Ti.App.addEventListener('service.normal:executed', function appEventHandler(e) {
			Ti.App.removeEventListener(e.type, appEventHandler);
			setTimeout(function () {
				Ti.Android.stopService(intent);
				finish();
			}, 500);
		});
		Ti.Android.startService(intent);
	});

	it('createService-foreground-normal', function (finish) {
		var intent,
			service,
			channel = null;
		this.timeout(10000);

		intent = Ti.Android.createServiceIntent({
			url: 'ti.android.service.normal.js',
		});
		service = Ti.Android.createService(intent);
		if (Ti.Platform.Android.API_LEVEL >= 26) {
			channel = Ti.Android.NotificationManager.createNotificationChannel({
				id: 'ti_android_service_test_channel',
				name: 'Channel Name',
				importance: Ti.Android.IMPORTANCE_DEFAULT
			});
		}
		service.foregroundNotify(101, Ti.Android.createNotification({
			contentTitle: 'Foreground Service',
			contentText: 'Content Text',
			channelId: channel ? channel.id : null,
			contentIntent: Ti.Android.createPendingIntent({
				intent: Ti.App.Android.launchIntent
			})
		}));
		Ti.App.addEventListener('service.normal:executed', function appEventHandler(e) {
			Ti.App.removeEventListener(e.type, appEventHandler);
			setTimeout(function () {
				service.foregroundCancel();
				setTimeout(function () {
					service.stop();
					finish();
				}, 500);
			}, 500);
		});
		service.start();
	});
});
