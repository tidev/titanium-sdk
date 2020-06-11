/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI', function () {

	it.ios('.BORDER_CORNER_* constants', () => {
		should(Ti.UI.BORDER_CORNER_BOTTOM_LEFT).be.a.Number();
		should(Ti.UI.BORDER_CORNER_BOTTOM_RIGHT).be.a.Number();
		should(Ti.UI.BORDER_CORNER_TOP_LEFT).be.a.Number();
		should(Ti.UI.BORDER_CORNER_TOP_RIGHT).be.a.Number();
	});
});
