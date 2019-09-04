/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off", import/no-absolute-path: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI', function () {
	it('.SEMANTIC_COLOR_TYPE_DARK', function () {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_DARK').which.is.a.string;
	});

	it('.SEMANTIC_COLOR_TYPE_LIGHT', function () {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_LIGHT').which.is.a.string;
	});

	it('semanticColorType default', function () {
		should(Ti.UI.semanticColorType).eql(Ti.UI.SEMANTIC_COLOR_TYPE_LIGHT);
	});

	it('fetchSemanticColor', function () {
		var isiOS13 = (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') && (parseInt(Ti.Platform.version.split('.')[0]) >= 13);
		const semanticColors = require('/semantic.colors.json');

		if (isiOS13) {
			should(Ti.UI.fetchSemanticColor('textColor')).be.an.string;
		} else {
			should(Ti.UI.fetchSemanticColor('textColor')).equal(semanticColors.textColor.light);
			Ti.UI.semanticColorType = Ti.UI.SEMANTIC_COLOR_TYPE_DARK;
			should(Ti.UI.fetchSemanticColor('textColor')).equal(semanticColors.textColor.dark);

		}
	});
});
