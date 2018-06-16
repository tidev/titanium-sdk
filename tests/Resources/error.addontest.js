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

describe('Error', function () {
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
