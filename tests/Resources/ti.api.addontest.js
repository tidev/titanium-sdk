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

describe('Titanium.API', function () {
	it('integer to boolean conversion', function () {
		var view = Ti.UI.createView({ bubbleParent: 0 });

		should(view.bubbleParent).be.eql(false);
		view.bubbleParent = 1;
		should(view.bubbleParent).be.eql(true);
	});
});
