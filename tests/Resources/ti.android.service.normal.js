/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium */
/* eslint no-unused-expressions: "off" */
'use strict';

// --------------------------------------------------------------------------------
// This Android "service" script only executes once.
// --------------------------------------------------------------------------------

// Fetch a reference to this service.
var service = Ti.Android.currentService;

// Log that this script has been executed.
Ti.API.info('Executing service script: "ti.android.service.normal.js"');

// Notify owner that this service has been executed.
Ti.App.fireEvent('service.normal:executed', {});

// Set up as a foreground service if requested via intent.
let notificationId = service.intent.getIntExtra('foregroundNotificationId', 0);
if (notificationId !== 0) {
	let channel = null;
	if (Ti.Platform.Android.API_LEVEL >= 26) {
		channel = Ti.Android.NotificationManager.createNotificationChannel({
			id: 'ti_android_service_normal_channel',
			name: 'Channel Name',
			importance: Ti.Android.IMPORTANCE_DEFAULT
		});
	}
	service.foregroundNotify(notificationId, Ti.Android.createNotification({
		contentTitle: 'Foreground Service',
		contentText: 'Content Text',
		channelId: channel ? channel.id : null,
		contentIntent: Ti.Android.createPendingIntent({
			intent: Ti.App.Android.launchIntent
		})
	}));
}

// Have this service stop itself if requested via intent.
if (service.intent.getBooleanExtra('doSelfStop', false)) {
	setTimeout(function () {
		service.stop();
		Ti.App.fireEvent('service.normal:stopped', {});
	}, 1000);
} else if (service.intent.getBooleanExtra('doStopWithIntent', false)) {
	setTimeout(function () {
		Ti.Android.stopService(service.intent);
		Ti.App.fireEvent('service.normal:stopped', {});
	}, 1000);
}
