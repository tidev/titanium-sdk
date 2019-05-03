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
const should = require('./utilities/assertions');

describe('Ti.Blob', function () {
	describe('#toString()', function () {
		it('is a Function', function () {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.toString).be.a.Function;
		});

		it('returns text value', function () {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.toString()).eql(blob.text);
		});
	});
});
