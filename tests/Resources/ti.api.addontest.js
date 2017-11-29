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

	it('Ti.API.log with one non-String parameter', function () {
		Ti.API.log({ key: 'value' }); // used to cause crash
		should(true).equal(true);
	});

	it('Ti.API.log with second non-String parameter', function () {
		Ti.API.log('debug', { key: 'value' }); // used to cause crash
		should(true).equal(true);
	});
});
