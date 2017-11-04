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
	
	it('#constants', function() {
		// Used in MaskedImage.mode
		should(Ti.UI.iOS.BLEND_MODE_CLEAR).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_COLOR).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_COLOR_BURN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_COLOR_DODGE).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_COPY).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DARKEN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DESTINATION_ATOP).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DESTINATION_IN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DESTINATION_OUT).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DESTINATION_OVER).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_DIFFERENCE).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_EXCLUSION).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_HARD_LIGHT).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_HUE).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_LIGHTEN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_LUMINOSITY).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_MULTIPLY).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_NORMAL).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_OVERLAY).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_PLUS_DARKER).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_PLUS_LIGHTER).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SATURATION).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SCREEN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SOFT_LIGHT).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SOURCE_ATOP).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SOURCE_IN).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_SOURCE_OUT).be.a.Number;
		should(Ti.UI.iOS.BLEND_MODE_XOR).be.a.Number;
		
		// Used in BlurView.effect
		should(Ti.UI.iOS.BLUR_EFFECT_STYLE_DARK).be.a.Number;
		should(Ti.UI.iOS.BLUR_EFFECT_STYLE_EXTRA_LIGHT).be.a.Number;
		should(Ti.UI.iOS.BLUR_EFFECT_STYLE_LIGHT).be.a.Number;
		should(Ti.UI.iOS.BLUR_EFFECT_STYLE_PROMINENT).be.a.Number;
		should(Ti.UI.iOS.BLUR_EFFECT_STYLE_REGULAR).be.a.Number;

		// Used in View.clipMode
		should(Ti.UI.iOS.CLIP_MODE_DEFAULT).be.a.Number;
		should(Ti.UI.iOS.CLIP_MODE_DISABLED).be.a.Number;
		should(Ti.UI.iOS.CLIP_MODE_ENABLED).be.a.Number;
		
		// Used in CollisionBehavior.collisionMode
		should(Ti.UI.iOS.COLLISION_MODE_ALL).be.a.Number;
		should(Ti.UI.iOS.COLLISION_MODE_BOUNDARY).be.a.Number;
		should(Ti.UI.iOS.COLLISION_MODE_ITEM).be.a.Number;
		
		// Used in FeedbackGenerator.style
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_HEAVY).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_LIGHT).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_IMPACT_STYLE_MEDIUM).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_NOTIFICATION_TYPE_ERROR).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_NOTIFICATION_TYPE_SUCCESS).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_NOTIFICATION_TYPE_WARNING).be.a.Number;

		// Used in FeedbackGenerator.type
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_TYPE_IMPACT).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_TYPE_NOTIFICATION).be.a.Number;
		should(Ti.UI.iOS.FEEDBACK_GENERATOR_TYPE_SELECTION).be.a.Number;		

		// Used in ScrollView.keyboardDismissMode, ListView.keyboardDismissMode & TableView.keyboardDismissMode
		should(Ti.UI.iOS.KEYBOARD_DISMISS_MODE_INTERACTIVE).be.a.Number;
		should(Ti.UI.iOS.KEYBOARD_DISMISS_MODE_NONE).be.a.Number;
		should(Ti.UI.iOS.KEYBOARD_DISMISS_MODE_ON_DRAG).be.a.Number;
		should(Ti.UI.iOS.KEYBOARD_DISMISS_MODE_ALWAYS).be.a.Number;
		should(Ti.UI.iOS.KEYBOARD_DISMISS_MODE_AUTOMATIC).be.a.Number;

		// Used in Window.largeTitleDisplayMode
		should(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS).be.a.Number;
		should(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC).be.a.Number;

		// Used in LivePhotoBadge.type
		should(Ti.UI.iOS.LIVEPHOTO_BATCH_OPTIONS_LIVE_OFF).be.a.Number;
		should(Ti.UI.iOS.LIVEPHOTO_BATCH_OPTIONS_OVER_CONTENT).be.a.Number;
	});
});
