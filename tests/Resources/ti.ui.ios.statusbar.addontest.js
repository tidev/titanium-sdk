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

describe.ios('Titanium.UI.iOS.StatusBar', function () {

	it('#constants', function () {

		should(Ti.UI.iOS.StatusBar.ANIMATION_STYLE_NONE).be.a.Number;
		should(Ti.UI.iOS.StatusBar.ANIMATION_STYLE_SLIDE).be.a.Number;
		should(Ti.UI.iOS.StatusBar.ANIMATION_STYLE_FADE).be.a.Number;

		should(Ti.UI.iOS.StatusBar.DEFAULT).be.a.Number;
		should(Ti.UI.iOS.StatusBar.GRAY).be.a.Number;
		should(Ti.UI.iOS.StatusBar.GREY).be.a.Number;
		should(Ti.UI.iOS.StatusBar.LIGHT_CONTENT).be.a.Number;
		var isiOS13 =  (parseInt(Ti.Platform.version.split('.')[0]) >= 13);
		if (isiOS13) {
			should(Ti.UI.iOS.StatusBar.DARK_CONTENT).be.a.Number;
		}
	});
});
