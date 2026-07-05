/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Android.NotificationManager', function () {
	it.android('Notifications enabled by default', function () {
		// Android 13+ (API 33+) requires the POST_NOTIFICATIONS runtime
		// permission, which the test app does not declare/request. On those
		// versions notifications are disabled by default; the assertion only
		// holds on API < 33.
		if (Ti.Platform.Android.API_LEVEL >= 33) {
			this.skip();
			return;
		}
		var notificationEnabled = Ti.Android.NotificationManager.areNotificationsEnabled();
		should(notificationEnabled).be.a.Boolean();
		should(notificationEnabled).be.true();
	});
});
