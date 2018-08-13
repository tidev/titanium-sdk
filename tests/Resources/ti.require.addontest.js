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

describe('require()', function () {
	it('JSON-based require() with single-quotes', function () {
		var amber = require('./json_files/amber');
		should(amber).have.property('sdk');
		should(amber.sdk).be.eql('7.4.0.v20180627024922');
	});
});
