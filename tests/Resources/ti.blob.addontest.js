/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Blob', function () {
	describe('#toString()', function () {
		it('binary content', function () {
			const blob = Ti.Filesystem.getFile('SmallLogo.png').read();
			should(blob.toString()).eql('[object TiBlob]');
		});

		it('empty string', function () {
			const blob = Ti.createBuffer({ value: '' }).toBlob();
			should(blob.toString()).eql('');
		});

		it('text content', function () {
			const blob = Ti.createBuffer({ value: 'test toString()' }).toBlob();
			should(blob.toString()).eql('test toString()');
		});

	});
});
