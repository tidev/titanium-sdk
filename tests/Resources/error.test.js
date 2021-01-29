/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */

/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'), // eslint-disable-line no-unused-vars
	utilities = require('./utilities/utilities');

describe('Error', function () {
	it('JS error thrown', function () {
		var e = {};

		try {
			Ti.API.info(e.test.crash);
			should.fail('Expected to throw exception');
		} catch (ex) {
			should(ex).have.property('message').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.message).equal('Cannot read property \'crash\' of undefined');
			} else {
				should(ex.message).equal('undefined is not an object (evaluating \'e.test.crash\')');
			}

			// has typical stack property
			should(ex).have.property('stack').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.stack).containEql('TypeError: Cannot read property \'crash\' of undefined');
			}
			// FIXME We should attempt to format the iOS stack to look/feel similar to Android/Node if possible.

			// iOS Has just the stacktrace without a preceding message/type. Also has 'column', 'line', 'sourceURL'
			// does not have java stack trace
			should(ex).not.have.property('nativeStack');
		}
	});

	it('Native exception surfaced', function () {
		try {
			if (utilities.isIOS()) {
				Ti.Codec.encodeNumber({
					source: 123,
					type: Ti.Codec.TYPE_LONG,
				});
			} else {
				Ti.Geolocation.accuracy = null; // The test assumes this will error out on the native side...
			}
			should.fail('Expected to throw exception');
		} catch (ex) {
			// message property
			should(ex).have.property('message').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.message).equal('Unable to convert null');
			} else if (utilities.isIOS()) {
				should(ex.message).equal('Invalid type passed to function');
			} else if (utilities.isWindows()) {
				should(ex.message).equal('Ti.Geolocation.accuracy expects Number');
			}

			// has typical stack property for JS
			should(ex).have.property('stack').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.stack).containEql('Error: Unable to convert null'); // TODO Verify app.js in stack?
			}
			// FIXME iOS just has a horrendous stack, it isn't prefixed by the message or type
			// We do convert it to look like Android/Node in the error dialog, but can we do that in a lower place?
			// Looks like this happens under the covers in JSC and I don't see how to affect it.

			// has special nativeStack property for native stacktrace
			should(ex).have.property('nativeStack').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.nativeStack).containEql('org.appcelerator.titanium.util.TiConvert.toInt(TiConvert.java:'); // points to Java code in stack
			} else if (utilities.isIOS()) {
				// FIXME: This is not a reliable conditional test.
				// should(ex.nativeStack).containEql('-[CodecModule encodeNumber:]');
			}
		}
	});

	it('throw(String)', function () {
		try {
			throw ('this is my error string'); // eslint-disable-line no-throw-literal
		} catch (ex) {
			should(ex).be.a.String();
			should(ex).equal('this is my error string');
			should(ex).not.have.property('message');
			should(ex).not.have.property('stack');
			should(ex).not.have.property('nativeStack');
		}
	});

	// Google V8 normally returns '{}' in this case because Error properties are not enumerable.
	// This tests Titanium's custom Error.toJSON() handling to expose properties like JavaScriptCore.
	it('JSON.stringify(Error)', function () {
		var err = new Error('My error message'),
			jsonString = JSON.stringify(err),
			jsonTable = JSON.parse(jsonString);
		should(jsonTable.message).be.eql(err.message);
	});

	it('JSON.stringify(NestedError)', function () {
		var errorTop,
			jsonString,
			jsonTable;
		errorTop = new Error('Top error message');
		errorTop.nestedError = new TypeError('Nested error message');
		jsonString = JSON.stringify({
			wasSuccessful: false,
			error: errorTop,
		});
		jsonTable = JSON.parse(jsonString);
		should(jsonTable.error.message).be.eql(errorTop.message);
		should(jsonTable.error.nestedError.message).be.eql(errorTop.nestedError.message);
	});
});
