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

describe('Titanium.UI.Window', function () {
	it.ios('.modalPresentationStyles', function () {
		should(Ti.UI.iOS.MODAL_PRESENTATION_PAGESHEET).be.a.Number;
		should(Ti.UI.iOS.MODAL_PRESENTATION_FORMSHEET).be.a.Number;
		should(Ti.UI.iOS.MODAL_PRESENTATION_CURRENT_CONTEXT).be.a.Number;
		should(Ti.UI.iOS.MODAL_PRESENTATION_OVER_CURRENT_CONTEXT).be.a.Number;
		should(Ti.UI.iOS.MODAL_PRESENTATION_OVER_CURRENT_FULL_SCREEN).be.a.Number;
	});
});
