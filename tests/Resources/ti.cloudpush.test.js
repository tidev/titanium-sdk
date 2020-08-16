/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe.android('ti.cloudpush', () => {
	// FIXME: Need to set up firebase on test app?
	it.androidBroken('retrieveDeviceToken()', finish => {
		const CloudPush = require('ti.cloudpush');
		CloudPush.retrieveDeviceToken({
			success: () => finish(),
			error: () => finish(new Error('could not retreive device token'))
		});
	});
});
