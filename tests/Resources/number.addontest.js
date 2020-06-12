/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */

/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Number', function () {
	it('#toLocaleString()', () => {
		const value = 1234567.8;

		should(value.toLocaleString).not.be.undefined();
		should(value.toLocaleString).be.a.Function();
		should(value.toLocaleString()).be.a.String();
		should(value.toLocaleString('en-US')).be.a.String();
		should(value.toLocaleString([ 'en-US' ])).be.a.String();
		should(value.toLocaleString([ 'en-US', 'de-DE' ])).be.a.String();
		should(value.toLocaleString(undefined, { style: 'decimal' })).be.a.String();
		should(value.toLocaleString('en-US', { style: 'decimal' })).be.a.String();
		should(value.toLocaleString([ 'en-US' ], { style: 'decimal' })).be.a.String();
		should(value.toLocaleString([ 'en-US', 'de-DE' ], { style: 'decimal' })).be.a.String();

		should(value.toLocaleString('en-US', { useGrouping: false })).be.eql('1234567.8');
		should(value.toLocaleString('en-US', { useGrouping: true })).be.eql('1,234,567.8');

		should(value.toLocaleString('de-DE', { useGrouping: false })).be.eql('1234567,8');
		should(value.toLocaleString('de-DE', { useGrouping: true })).be.eql('1.234.567,8');
	});
});
