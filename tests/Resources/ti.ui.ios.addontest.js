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

describe.ios('Titanium.UI.iOS', function () {

	it('#constants', function () {
		// Used in BlurView.effect. Need to copy under #constatnt test case
		var isiOS13 =  (parseInt(Ti.Platform.version.split('.')[0]) >= 13);
		if (isiOS13) {
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_ULTRA_THIN_MATERIAL).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THIN_MATERIAL).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_MATERIAL).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THICK_MATERIAL).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_CHROME_MATERIAL).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_ULTRA_THIN_MATERIAL_LIGHT).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THIN_MATERIAL_LIGHT).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_MATERIAL_LIGHT).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THICK_MATERIAL_LIGHT).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_CHROME_MATERIAL_LIGHT).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_ULTRA_THIN_MATERIAL_DARK).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THIN_MATERIAL_DARK).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_MATERIAL_DARK).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_THICK_MATERIAL_DARK).be.a.Number;
			should(Ti.UI.iOS.BLUR_EFFECT_STYLE_SYSTEM_CHROME_MATERIAL_DARK).be.a.Number;
		}
	});
});
