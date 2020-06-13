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

describe('String', function () {
	it('#localeCompare()', () => {
		const string1 = 'réservé';
		const string2 = 'RESERVE';
		should(string1.localeCompare).not.be.undefined();
		should(string1.localeCompare).be.a.Function();
		should(string1.localeCompare(string2)).be.a.Number();
		should(string1.localeCompare(string2)).be.above(0);
		should(string1.localeCompare(string2, 'en')).be.above(0);
		should(string1.localeCompare(string2, [ 'en' ])).be.above(0);
		should(string1.localeCompare(string2, [ 'en', 'de' ])).be.above(0);
		should(string1.localeCompare(string2, undefined, { sensitivity: 'base' })).be.eql(0);
		should(string1.localeCompare(string2, 'en', { sensitivity: 'base' })).be.eql(0);
		should(string1.localeCompare(string2, [ 'en' ], { sensitivity: 'base' })).be.eql(0);
		should(string1.localeCompare(string2, [ 'en', 'de' ], { sensitivity: 'base' })).be.eql(0);
	});

	it('#toLocaleLowerCase()', () => {
		const text = 'İstanbul';
		should(text.toLocaleLowerCase).not.be.undefined();
		should(text.toLocaleLowerCase).be.a.Function();
		should(text.toLocaleLowerCase()).be.a.String();
		should(text.toLocaleLowerCase('en-US')).be.eql('i̇stanbul');
		should(text.toLocaleLowerCase([ 'en-US' ])).be.eql('i̇stanbul');
		should(text.toLocaleLowerCase([ 'en-US', 'de-DE' ])).be.eql('i̇stanbul');
		should(text.toLocaleLowerCase('tr-TR')).be.eql('istanbul');
		should(text.toLocaleLowerCase([ 'tr-TR' ])).be.eql('istanbul');
	});

	it('#toLocaleUpperCase()', () => {
		const text = 'istanbul';
		should(text.toLocaleUpperCase).not.be.undefined();
		should(text.toLocaleUpperCase).be.a.Function();
		should(text.toLocaleUpperCase()).be.a.String();
		should(text.toLocaleUpperCase('en-US')).be.eql('ISTANBUL');
		should(text.toLocaleUpperCase([ 'en-US' ])).be.eql('ISTANBUL');
		should(text.toLocaleUpperCase([ 'en-US', 'de-DE' ])).be.eql('ISTANBUL');
		should(text.toLocaleUpperCase('tr-TR')).be.eql('İSTANBUL');
		should(text.toLocaleUpperCase([ 'tr-TR' ])).be.eql('İSTANBUL');
	});
});
