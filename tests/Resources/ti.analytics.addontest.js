/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Analytics', function () {
	it.androidMissing('.optedOut', function () {
		should(Ti.Analytics.optedOut).be.a.Boolean;
		should(Ti.Analytics.setOptedOut).be.a.Function;
		should(Ti.Analytics.getOptedOut).be.a.Function;

		should(Ti.Analytics.optedOut).eql(false);
		should(Ti.Analytics.getOptedOut()).eql(false);

		Ti.Analytics.optedOut = true;

		should(Ti.Analytics.optedOut).eql(true);
		should(Ti.Analytics.getOptedOut()).eql(true);

		Ti.Analytics.setOptedOut(false);

		should(Ti.Analytics.optedOut).eql(false);
		should(Ti.Analytics.getOptedOut()).eql(false);
	});
});
