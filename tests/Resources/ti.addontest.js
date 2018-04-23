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

describe('Titanium', function () {
	it.android('validate exception stack trace output', function () {
		var e = {};

		try {
			Ti.API.info(e.test.crash);
		} catch (ex) {
			ex.toString().includes('Cannot read property \'crash\' of undefined').should.be.true();
		}
	});
});
