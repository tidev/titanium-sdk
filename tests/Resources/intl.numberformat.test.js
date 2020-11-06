/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS, OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Intl.NumberFormat', () => {
	it('#constructor()', () => {
		should(Intl.NumberFormat).not.be.undefined();
		should(Intl.NumberFormat).be.a.Function();
		should(Intl.NumberFormat.prototype.constructor).not.be.undefined();
		should(Intl.NumberFormat.prototype.constructor).be.a.Function();
		should(Intl.NumberFormat.prototype.constructor === Intl.NumberFormat).be.true();
		should(new Intl.NumberFormat()).be.an.Object();
		should(new Intl.NumberFormat('en-US')).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US' ])).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US', 'de-DE' ])).be.an.Object();
		should(new Intl.NumberFormat(undefined, { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat('en-US', { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US' ], { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US', 'de-DE' ], { style: 'decimal' })).be.an.Object();
	});

	describe('#format()', () => {
		it('validate function', () => {
			const formatter = new Intl.NumberFormat();
			should(formatter.format).not.be.undefined();
			should(formatter.format).be.a.Function();
			should(formatter.format(123.456)).be.a.String();
		});

		it('useGrouping', () => {
			const numericValue = 1234567.8;

			let formatter = new Intl.NumberFormat('en-US', { useGrouping: false });
			should(formatter.format(numericValue)).be.eql('1234567.8');
			formatter = new Intl.NumberFormat('en-US', { useGrouping: true });
			should(formatter.format(numericValue)).be.eql('1,234,567.8');

			formatter = new Intl.NumberFormat('de-DE', { useGrouping: false });
			should(formatter.format(numericValue)).be.eql('1234567,8');
			formatter = new Intl.NumberFormat('de-DE', { useGrouping: true });
			should(formatter.format(numericValue)).be.eql('1.234.567,8');
		});

		it('maximumSignificantDigits', () => {
			const formatter = new Intl.NumberFormat('en-US', {
				maximumSignificantDigits: 3,
				useGrouping: false
			});
			should(formatter.format(12345.6)).be.eql('12300');
			should(formatter.format(-12345.6)).be.eql('-12300');
			should(formatter.format(1.23456)).be.eql('1.23');
			should(formatter.format(-1.23456)).be.eql('-1.23');
			should(formatter.format(5555.55)).be.eql('5560');
			should(formatter.format(-5555.55)).be.eql('-5560');
		});

		it('minimumIntegerDigits', () => {
			const formatter = new Intl.NumberFormat('en-US', {
				minimumIntegerDigits: 3,
				useGrouping: false
			});
			should(formatter.format(0)).be.eql('000');
			should(formatter.format(1.23)).be.eql('001.23');
			should(formatter.format(12345)).be.eql('12345');
		});

		it('maximumFractionDigits', () => {
			const formatter = new Intl.NumberFormat('en-US', {
				maximumFractionDigits: 3,
				useGrouping: false
			});
			should(formatter.format(1.2345678)).be.eql('1.235');
			should(formatter.format(-1.2345678)).be.eql('-1.235');
			should(formatter.format(123)).be.eql('123');
			should(formatter.format(0.1)).be.eql('0.1');
		});

		it('minimumFractionDigits', () => {
			const formatter = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 3,
				useGrouping: false
			});
			should(formatter.format(123)).be.eql('123.000');
			should(formatter.format(0.1)).be.eql('0.100');
		});

		it('currency', () => {
			const options = {
				style: 'currency',
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
				useGrouping: true
			};
			let formatter = new Intl.NumberFormat('en-US', Object.assign({ currency: 'USD' }, options));
			should(formatter.format(1000)).be.eql('$1,000.00');
			formatter = new Intl.NumberFormat('en-US', Object.assign({ currency: 'EUR' }, options));
			should(formatter.format(1000)).be.eql('€1,000.00');
			formatter = new Intl.NumberFormat('de-DE', Object.assign({ currency: 'EUR' }, options));
			should(formatter.format(1000)).be.eql('1.000,00\u00A0€');
			formatter = new Intl.NumberFormat('de-DE', Object.assign({ currency: 'USD' }, options));
			should(formatter.format(1000)).be.eql('1.000,00\u00A0$');
		});

		it('percent', () => {
			const formatter = new Intl.NumberFormat('en-US', {
				style: 'percent',
				maximumFractionDigits: 1,
				useGrouping: false
			});
			should(formatter.format(0.25)).be.eql('25%');
			should(formatter.format(-0.25)).be.eql('-25%');
			should(formatter.format(1.0)).be.eql('100%');
			should(formatter.format(12.345)).be.eql('1234.5%');
			should(formatter.format(12.3456)).be.eql('1234.6%');
			should(formatter.format(-12.3456)).be.eql('-1234.6%');
		});

		it.android('engineering notation', () => {
			const numericValue = 123456.7;
			let formatter = new Intl.NumberFormat('en-US', { notation: 'engineering' });
			should(formatter.format(numericValue)).be.eql('123.457E3');
			formatter = new Intl.NumberFormat('de-DE', { notation: 'engineering' });
			should(formatter.format(numericValue)).be.eql('123,457E3');
		});

		it.android('scientific notation', () => {
			const numericValue = 123456.7;
			let formatter = new Intl.NumberFormat('en-US', { notation: 'scientific' });
			should(formatter.format(numericValue)).be.eql('1.235E5');
			formatter = new Intl.NumberFormat('de-DE', { notation: 'scientific' });
			should(formatter.format(numericValue)).be.eql('1,235E5');
		});
	});

	describe('#formatToParts()', () => {
		if (OS_IOS && (OS_VERSION_MAJOR < 13)) {
			return;
		}

		it('validate function', () => {
			const formatter = new Intl.NumberFormat();
			should(formatter.formatToParts).not.be.undefined();
			should(formatter.formatToParts).be.a.Function();
			should(formatter.formatToParts(123.456)).be.an.Array();
		});

		it('decimal', () => {
			let formatter = new Intl.NumberFormat('en-US', { useGrouping: true });
			let partsArray = formatter.formatToParts(-1234567.8);
			should(partsArray).be.an.Array();
			should(partsArray).be.eql([
				{ type: 'minusSign', value: '-' },
				{ type: 'integer', value: '1' },
				{ type: 'group', value: ',' },
				{ type: 'integer', value: '234' },
				{ type: 'group', value: ',' },
				{ type: 'integer', value: '567' },
				{ type: 'decimal', value: '.' },
				{ type: 'fraction', value: '8' }
			]);

			formatter = new Intl.NumberFormat('de-DE', { useGrouping: true });
			partsArray = formatter.formatToParts(-1234567.8);
			should(partsArray).be.an.Array();
			should(partsArray).be.eql([
				{ type: 'minusSign', value: '-' },
				{ type: 'integer', value: '1' },
				{ type: 'group', value: '.' },
				{ type: 'integer', value: '234' },
				{ type: 'group', value: '.' },
				{ type: 'integer', value: '567' },
				{ type: 'decimal', value: ',' },
				{ type: 'fraction', value: '8' }
			]);
		});

		it('currency', () => {
			const options = {
				style: 'currency',
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
				useGrouping: true
			};

			let formatter = new Intl.NumberFormat('en-US', Object.assign({ currency: 'USD' }, options));
			let partsArray = formatter.formatToParts(100);
			should(partsArray).be.an.Array();
			should(partsArray).be.eql([
				{ type: 'currency', value: '$' },
				{ type: 'integer', value: '100' }
			]);

			formatter = new Intl.NumberFormat('de-DE', Object.assign({ currency: 'EUR' }, options));
			partsArray = formatter.formatToParts(100);
			should(partsArray).be.an.Array();
			should(partsArray).be.eql([
				{ type: 'integer', value: '100' },
				{ type: 'literal', value: '\u00A0' },  // Non-breaking space.
				{ type: 'currency', value: '€' }
			]);
		});
	});

	it('#resolvedOptions()', () => {
		const formatter = new Intl.NumberFormat();
		should(formatter.resolvedOptions).not.be.undefined();
		should(formatter.resolvedOptions).be.a.Function();
		should(formatter.resolvedOptions()).be.an.Object();
	});

	describe('#supportedLocalesOf()', () => {
		it('is a Function', () => {
			should(Intl.NumberFormat.supportedLocalesOf).not.be.undefined();
			should(Intl.NumberFormat.supportedLocalesOf).be.a.Function();
		});

		it('empty Array', () => {
			const locales = Intl.NumberFormat.supportedLocalesOf([]);
			should(locales).be.an.Array();
			should(locales.length).be.eql(0);
		});

		it('Array with 1 String', () => {
			const locales = Intl.NumberFormat.supportedLocalesOf([ 'en-US' ]);
			should(locales).be.an.Array();
			should(locales.length).be.eql(1);
			should(locales[0]).be.eql('en-US');
		});

		it('Array with 2 Strings', () => {
			const locales = Intl.NumberFormat.supportedLocalesOf([ 'en-US', 'de-DE' ]);
			should(locales).be.an.Array();
			should(locales.length).be.eql(2);
			should(locales[0]).be.eql('en-US');
			should(locales[1]).be.eql('de-DE');
		});

		it('Array containing invalid locale', () => {
			const locales = Intl.NumberFormat.supportedLocalesOf([ 'uh-oh', 'en-US' ]);
			should(locales).be.an.Array();
			should(locales.length).be.eql(1);
			should(locales[0]).be.eql('en-US');
		});
	});
});
