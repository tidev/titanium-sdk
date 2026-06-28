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

describe.android('Titanium.App.Android', function () {
	it('appVersionCode', function () {
		// Defined in file: ./platform/android/build.gradle
		should(Ti.App.Android.appVersionCode).not.be.undefined();
		should(Ti.App.Android.appVersionCode).be.a.Number();
		should(Ti.App.Android.appVersionCode).be.eql(101);
	});

	it('appVersionName', function () {
		// Defined in file: ./platform/android/AndroidManifest.xml
		should(Ti.App.Android.appVersionName).not.be.undefined();
		should(Ti.App.Android.appVersionName).be.a.String();
		should(Ti.App.Android.appVersionName).be.eql('v1.01');
	});

	it('launchIntent', function () {
		const launchIntent = Ti.App.Android.launchIntent;
		should(launchIntent).not.be.undefined();
		should(launchIntent).be.a.Object();
		should(launchIntent.packageName).eql(Ti.App.id);
	});
});
