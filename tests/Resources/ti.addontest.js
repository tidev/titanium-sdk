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
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Error', function () {
	it.android('JS error thrown', function () {
		var e = {};

		try {
			Ti.API.info(e.test.crash);
			should.fail('Expected to throw exception');
		} catch (ex) {
			ex.message.should.equal('Cannot read property \'crash\' of undefined');
		}
	});

	it.android('Java exception surfaced', function () {
		try {
			Ti.Geolocation.accuracy = null;
			should.fail('Expected to throw exception');
		} catch (ex) {
			ex.message.should.equal('Unable to convert null'); // message property is undefined now, so this will fail
			// stack property is also undefined so this will fail
			ex.stack.should.containEql('org.appcelerator.titanium.util.TiConvert.toInt(TiConvert.java:'); // points to Java code in stack
		}
	});
});
