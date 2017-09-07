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

describe.ios('Titanium.UI.iOS', function () {

	// TODO Add tests for all the constants in this namespace!

	// --- properties ---
	it('appBadge', function () {
		should(Ti.UI.iOS.appBadge).be.undefined;
		// TODO Set the value and test it got set
	});

	it('appSupportsShakeToEdit', function () {
		should(Ti.UI.iOS.appSupportsShakeToEdit).be.true; // TODO Set default to true in docs?
		// TODO Set the value and test it got set
	});

	it('forceTouchSupported', function () {
		should(Ti.UI.iOS).have.readOnlyProperty('forceTouchSupported').which.is.a.Boolean;
		// TODO Validate the value based on the device?
	});

	it('statusBarBackgroundColor', function () {
		should(Ti.UI.iOS.statusBarBackgroundColor).be.undefined;
		// TODO Test that this accepts normal color values (names, hex, etc)
	});

	// --- methods ---

	// TIMOB-23542 test livePhotoBadge
	it('#createLivePhotoBadge()', function () {
		var livePhotoBadge;
		should(Ti.UI.iOS.createLivePhotoBadge).not.be.undefined;
		should(Ti.UI.iOS.createLivePhotoBadge).be.a.Function;
		livePhotoBadge = Ti.UI.iOS.createLivePhotoBadge(Ti.UI.iOS.LIVEPHOTO_BADGE_OPTIONS_OVER_CONTENT);
		should(livePhotoBadge).be.an.Object;
		// TODO Test that we created a Ti.Blob!
	});

	// TODO Add tests for createTransitionAnimation
	it('#createTransitionAnimation(Object)');
});
