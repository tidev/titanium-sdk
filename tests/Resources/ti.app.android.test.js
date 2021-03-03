/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.android('Titanium.App.Android', function () {
	it('appVersionCode', function () {
		should(Ti.App.Android.appVersionCode).not.be.undefined();
		should(Ti.App.Android.appVersionCode).be.a.Number();
	});

	it('appVersionName', function () {
		should(Ti.App.Android.appVersionName).not.be.undefined();
		should(Ti.App.Android.appVersionName).be.a.String();
	});

	it('launchIntent', function () {
		const launchIntent = Ti.App.Android.launchIntent;
		should(launchIntent).not.be.undefined();
		should(launchIntent).be.a.Object();
		should(launchIntent.packageName).eql(Ti.App.id);
	});
});
