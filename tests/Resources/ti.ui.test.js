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

describe('Titanium.UI', function () {

	// TODO Write some tests for converting various units back and forth!
	it('#convertUnits(String, Number)');

	// Constants are tested in ti.ui.constants.test.js

	// TODO Write tests for Ti.UI.global properties below!
	it('backgroundColor');
	it('backgroundImage');
	it('currentTab');
	it('currentWindow');
	it.ios('tintColor');
});
