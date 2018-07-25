/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Ti.UI.View', function () {
	it('imageAsCompressed', function () {

		// create view to render
		const view = Ti.UI.createView({ backgroundColor: 'red', width: 256, height: 256 });

		// render view as image
		should(view.toImage).be.a.Function;
		const img = view.toImage();

		// compress image
		should(img.imageAsCompressed).be.a.Function;
		const cmp = img.imageAsCompressed(0.1);
		should(cmp).not.be.undefined;
	});
});
