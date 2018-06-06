/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

describe.android('Titanium.Android.Service', function () {
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
