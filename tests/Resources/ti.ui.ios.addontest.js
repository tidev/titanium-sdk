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

	it('#systemImage()', function () {
		var isiOS13 =  (parseInt(Ti.Platform.version.split('.')[0]) >= 13);
		if (isiOS13) {
			should(Ti.UI.iOS.systemImage).not.be.undefined;
			should(Ti.UI.iOS.systemImage).be.a.Function;
			var systemImage = Ti.UI.iOS.systemImage('drop.triangle.fill');
			should(systemImage).be.an.Object;
		}
	});
});
