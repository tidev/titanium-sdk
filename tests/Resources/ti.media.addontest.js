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

describe('Titanium.Media', function () {

	// video recording quality constants tests
	it('Video recording quality 640x480', function () {
		should(Ti.Media.QUALITY_640x480).not.be.undefined;
	});

	it('Video recording quality HIGH', function () {
		should(Ti.Media.QUALITY_HIGH).not.be.undefined;
	});

	it('Video recording quality IFRAME_1280x720', function () {
		should(Ti.Media.QUALITY_IFRAME_1280x720).not.be.undefined;
	});

	it.ios('Video recording quality 960x540', function () {
		should(Ti.Media.QUALITY_960x540).not.be.undefined;
	});

	it('Video recording quality LOW', function () {
		should(Ti.Media.QUALITY_LOW).not.be.undefined;
	});

	it.ios('Video recording quality MEDIUM', function () {
		should(Ti.Media.QUALITY_MEDIUM).not.be.undefined;
	});

});
