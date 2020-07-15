/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Locale', function () {
	describe('#parseDecimal()', () => {
		it('compared with String.formatDecimal()', () => {
			should(Ti.Locale.parseDecimal).be.a.Function();

			const numericValue = 1234567.8;

			let numericString = String.formatDecimal(numericValue);
			let parsedValue = Ti.Locale.parseDecimal(numericString);
			should(parsedValue).be.a.Number();
			should(Math.abs(parsedValue - numericValue)).be.lessThan(Number.EPSILON);

			numericString = String.formatDecimal(numericValue, 'de-DE');
			parsedValue = Ti.Locale.parseDecimal(numericString, 'de-DE');
			should(Math.abs(parsedValue - numericValue)).be.lessThan(Number.EPSILON);

			numericString = String.formatDecimal(numericValue, 'fr-FR');
			parsedValue = Ti.Locale.parseDecimal(numericString, 'fr-FR');
			should(Math.abs(parsedValue - numericValue)).be.lessThan(Number.EPSILON);

			numericString = String.formatDecimal(numericValue, 'ar-EG');
			parsedValue = Ti.Locale.parseDecimal(numericString, 'ar-EG');
			should(Math.abs(parsedValue - numericValue)).be.lessThan(Number.EPSILON);
		});

		it('localized values', () => {
			let result = Ti.Locale.parseDecimal('1,234,567.8', 'en-US');
			should(Math.abs(result - 1234567.8)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('1.234.567,8', 'de-DE');
			should(Math.abs(result - 1234567.8)).be.lessThan(Number.EPSILON);

			// France uses non-breaking unicode spaces for thousands separator.
			result = Ti.Locale.parseDecimal('1\u00A0234\u00A0567,8', 'fr-FR');
			should(Math.abs(result - 1234567.8)).be.lessThan(Number.EPSILON);
		});

		it('various values', () => {
			let result = Ti.Locale.parseDecimal('0', 'en-US');
			should(Math.abs(result)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('0.', 'en-US');
			should(Math.abs(result)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('.0', 'en-US');
			should(Math.abs(result)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('00.00123', 'en-US');
			should(Math.abs(result - 0.00123)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('+0', 'en-US');
			should(Math.abs(result)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('-0', 'en-US');
			should(Math.abs(result)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('+1234.5', 'en-US');
			should(Math.abs(result - 1234.5)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('-1234.5', 'en-US');
			should(Math.abs(result + 1234.5)).be.lessThan(Number.EPSILON);
		});

		it('scientific values', () => {
			let result = Ti.Locale.parseDecimal('1.2E+3', 'en-US');
			should(Math.abs(result - 1200.0)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('-1.2E+3', 'en-US');
			should(Math.abs(result + 1200.0)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('1.2E-3', 'en-US');
			should(Math.abs(result - 0.0012)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal('-1.2E-3', 'en-US');
			should(Math.abs(result + 0.0012)).be.lessThan(Number.EPSILON);
		});

		it('padded with spaces', () => {
			let result = Ti.Locale.parseDecimal(' 123 ', 'en-US');
			should(Math.abs(result - 123)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal(' +123 ', 'en-US');
			should(Math.abs(result - 123)).be.lessThan(Number.EPSILON);

			result = Ti.Locale.parseDecimal(' -123 ', 'en-US');
			should(Math.abs(result + 123)).be.lessThan(Number.EPSILON);
		});

		it('NaN', () => {
			let result = Ti.Locale.parseDecimal('ThisShouldFail');
			should(result).be.a.Number();
			should(result).be.eql(Number.NaN);

			result = Ti.Locale.parseDecimal('');
			should(result).be.eql(Number.NaN);

			result = Ti.Locale.parseDecimal(' ');
			should(result).be.eql(Number.NaN);

			result = Ti.Locale.parseDecimal(null);
			should(result).be.eql(Number.NaN);

			result = Ti.Locale.parseDecimal(undefined);
			should(result).be.eql(Number.NaN);
		});
	});
});
