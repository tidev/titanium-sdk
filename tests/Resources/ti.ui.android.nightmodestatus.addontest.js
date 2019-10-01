/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.android('Ti.UI.Android', () => {
	it('MODE_NIGHT_NO', () => {
		should.exist(Ti.UI.Android.MODE_NIGHT_NO);
	});
	it('MODE_NIGHT_UNDEFINED', () => {
		should.exist(Ti.UI.Android.MODE_NIGHT_UNDEFINED);
	});
	it('MODE_NIGHT_YES', () => {
		should.exist(Ti.UI.Android.MODE_NIGHT_YES);
	});
	it('nightModeStatus', () => {
		should.exist(Ti.UI.Android.nightModeStatus);
	});
});
