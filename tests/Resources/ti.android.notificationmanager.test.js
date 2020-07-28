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

describe('Titanium.Android.NotificationManager', function () {
	it.android('Notifications enabled by default', function () {
		var notificationEnabled = Ti.Android.NotificationManager.areNotificationsEnabled();
		should(notificationEnabled).be.a.Boolean();
		should(notificationEnabled).eql(true);
	});
});
