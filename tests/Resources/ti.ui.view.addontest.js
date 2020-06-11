/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.View', () => {

	it.android('borderRadiusEdges', () => {
		const view = Ti.UI.createView({
			width: 100,
			height: 100,
			borderRadiusCorners: [
				Ti.UI.BORDER_CORNER_TOP_LEFT,
				Ti.UI.BORDER_CORNER_TOP_RIGHT,
				Ti.UI.BORDER_CORNER_BOTTOM_LEFT,
				Ti.UI.BORDER_CORNER_BOTTOM_RIGHT
			]
		});

		should(view.borderRadiusCorners).be.a.Array();
	});
});
