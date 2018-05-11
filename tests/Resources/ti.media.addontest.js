/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Media', function () {
	it('openPhotoGallery', function () {
		should(Ti.Media.openPhotoGallery).not.be.undefined;
		should(Ti.Media.openPhotoGallery).be.a.Function;
	});
});
