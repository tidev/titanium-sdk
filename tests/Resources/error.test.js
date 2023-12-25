/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
				should(ex.message).be.equalOneOf([
					'Cannot read property \'crash\' of undefined',
					'Cannot read properties of undefined (reading \'crash\')'
				]);
			} else {
				should(ex.message).equal('undefined is not an object (evaluating \'e.test.crash\')');
			}

			// has typical stack property
			should(ex).have.property('stack').which.is.a.String();
			if (utilities.isAndroid()) {
				should(ex.stack.includes('TypeError: Cannot read properties of undefined (reading \'crash\')')
					|| ex.stack.includes('TypeError: Cannot read property \'crash\' of undefined')).be.true();
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
			ex.should.have.property('message').which.is.a.String();
			if (utilities.isAndroid()) {
				ex.message.should.equal('Unable to convert null');
			} else if (utilities.isIOS()) {
				should(ex.message.startsWith('Invalid type passed to function')).be.true();
			} else if (utilities.isWindows()) {
				ex.message.should.equal('Ti.Geolocation.accuracy expects Number');
			}

			// has typical stack property for JS
			ex.should.have.property('stack').which.is.a.String();
			if (utilities.isAndroid()) {
				ex.stack.should.containEql('Error: Unable to convert null'); // TODO Verify app.js in stack?
			}
			// FIXME iOS just has a horrendous stack, it isn't prefixed by the message or type
			// We do convert it to look like Android/Node in the error dialog, but can we do that in a lower place?
			// Looks like this happens under the covers in JSC and I don't see how to affect it.

			// has special nativeStack property for native stacktrace
			ex.should.have.property('nativeStack').which.is.a.String();
			if (utilities.isAndroid()) {
				ex.nativeStack.should.containEql('org.appcelerator.titanium.util.TiConvert.toInt(TiConvert.java:'); // points to Java code in stack
			} else if (utilities.isIOS()) {
				// FIXME: This is not a reliable conditional test.
				// ex.nativeStack.should.containEql('-[CodecModule encodeNumber:]');
			}
		}
	});

	it('throw(String)', function () {
		try {
			throw ('this is my error string'); // eslint-disable-line no-throw-literal
		} catch (ex) {
			ex.should.be.a.String();
			ex.should.equal('this is my error string');
			ex.should.not.have.property('message');
			ex.should.not.have.property('stack');
			ex.should.not.have.property('nativeStack');
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

	it.ios('should include native reason in message', () => {
		try {
			Ti.UI.createView({
				top: 20,
				backgroundGradient: {
					type: 'invalid'
				}
			});
		} catch (e) {
			should(e.message.startsWith('Invalid type passed to function')).be.true();
			should(e.nativeReason).be.eql('Must be either \'linear\' or \'radial\'');
		}
	});

	it.ios('should include full native call stack', () => {
		try {
			Ti.UI.createView({
				top: 20,
				backgroundGradient: {
					type: 'invalid'
				}
			});
		} catch (e) {
			should(e.nativeStack.includes('TiGradient gradientFromObject:')).be.true();
		}
	});
});
