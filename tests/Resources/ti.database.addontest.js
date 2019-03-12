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

describe('Titanium.Database', function () {
	// If the source db file was not found, then install() must throw an exception.
	it('install missing source db', function () {
		let wasExceptionThrown = false;
		try {
			Ti.Database.install('BadFilePath.db', 'IShouldNotExist.db');
		} catch (err) {
			wasExceptionThrown = true;
		}
		should(wasExceptionThrown).be.true;
	});
});
