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

describe('Titanium.UI', function () {

	it.androidMissing('TEXT_STYLE_* constants', function () {
		should(Ti.UI.TEXT_STYLE_HEADLINE).be.a.String;
		should(Ti.UI.TEXT_STYLE_SUBHEADLINE).be.a.String;
		should(Ti.UI.TEXT_STYLE_BODY).be.a.String;
		should(Ti.UI.TEXT_STYLE_FOOTNOTE).be.a.String;
		should(Ti.UI.TEXT_STYLE_CAPTION1).be.a.String;
		should(Ti.UI.TEXT_STYLE_CAPTION2).be.a.String;
		should(Ti.UI.TEXT_STYLE_CALLOUT).be.a.String;
		should(Ti.UI.TEXT_STYLE_TITLE1).be.a.String;
		should(Ti.UI.TEXT_STYLE_TITLE2).be.a.String;
		should(Ti.UI.TEXT_STYLE_TITLE3).be.a.String;
		should(Ti.UI.TEXT_STYLE_LARGE_TITLE).be.a.String;
	});
});
