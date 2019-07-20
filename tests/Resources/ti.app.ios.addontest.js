/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.ios('Titanium.App.iOS', function () {

	// To be added to the existing "#constants" test case
	it('#constants', function () {
		should(Ti.App.iOS.USER_INTERFACE_STYLE_UNSPECIFIED).be.a.Number;
		should(Ti.App.iOS.USER_INTERFACE_STYLE_LIGHT).be.a.Number;
		should(Ti.App.iOS.USER_INTERFACE_STYLE_DARK).be.a.Number;
	});

	it('.userInterfaceStyle', function () {
		var isiOS13 = (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') && (parseInt(Ti.Platform.version.split('.')[0]) >= 13);

		if (!isiOS13) {
			return;
		}

		// We only check for the type, since the value (light, dark, unspecified)
		// can vary between device configs
		should(Ti.App.iOS.userInterfaceStyle).be.a.Number;
	});
});
