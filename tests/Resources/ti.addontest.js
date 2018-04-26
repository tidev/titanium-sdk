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
			ex.should.have.property('message');
			ex.message.should.equal('Cannot read property \'crash\' of undefined');
			// has typical stack property
			ex.should.have.property('stack');
			ex.stack.should.containEql('TypeError: Cannot read property \'crash\' of undefined');
			// does not have java stack trace
			ex.should.not.have.property('nativeStack');
		}
	});

	it.android('Java exception surfaced', function () {
		try {
			Ti.Geolocation.accuracy = null;
			should.fail('Expected to throw exception');
		} catch (ex) {
			ex.should.have.property('message');
			ex.message.should.equal('Unable to convert null');
			// has typical stack property for JS
			ex.should.have.property('stack');
			ex.stack.should.containEql('Error: Unable to convert null'); // TODO Verify app.js in stack?
			// has special javaStack property for java stacktrace
			ex.should.have.property('nativeStack');
			ex.nativeStack.should.containEql('org.appcelerator.titanium.util.TiConvert.toInt(TiConvert.java:'); // points to Java code in stack
		}
	});

	it.android('throw(String)', function () {
		try {
			throw ('this is my error string'); // eslint-disable-line no-throw-literal
		} catch (ex) {
			ex.should.equal('this is my error string');
			ex.should.not.have.property('message');
			ex.should.not.have.property('stack');
			ex.should.not.have.property('nativeStack');
		}
	});
});
