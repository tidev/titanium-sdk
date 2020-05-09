/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */

/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Intl.NumberFormat', function () {
	it('#constructor()', () => {
		should(Intl).not.be.undefined();
		should(Intl.NumberFormat).not.be.undefined();
		should(Intl.NumberFormat).be.a.Function();
		should(new Intl.NumberFormat()).be.an.Object();
		should(new Intl.NumberFormat('en-US')).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US' ])).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US', 'de-DE' ])).be.an.Object();
		should(new Intl.NumberFormat('en-US', { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US' ], { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat([ 'en-US', 'de-DE' ], { style: 'decimal' })).be.an.Object();
		should(new Intl.NumberFormat({ style: 'decimal' })).be.an.Object();
	});

	describe('#format()', () => {
		it('validate function', () => {
			const formatter = Intl.NumberFormat();
			should(formatter.format).not.be.undefined();
			should(formatter.format).be.a.Function();
			should(formatter.format(123.456)).be.a.String();
		});

		it('useGrouping', () => {
			const numericValue = 1234567.8;

			let formatter = Intl.NumberFormat('en-US', { useGrouping: false });
			should(formatter.format(numericValue)).be.eql('1234567.8');
			formatter = Intl.NumberFormat('en-US', { useGrouping: true });
			should(formatter.format(numericValue)).be.eql('1,234,567.8');

			formatter = Intl.NumberFormat('de-DE', { useGrouping: false });
			should(formatter.format(numericValue)).be.eql('1234567,8');
			formatter = Intl.NumberFormat('de-DE', { useGrouping: true });
			should(formatter.format(numericValue)).be.eql('1.234.567,8');
		});

		it.android('maximumSignificantDigits', () => {
			const formatter = Intl.NumberFormat('en-US', {
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

		it.android('minimumIntegerDigits', () => {
			const formatter = Intl.NumberFormat('en-US', {
				minimumIntegerDigits: 3,
				useGrouping: false
			});
			should(formatter.format(0)).be.eql('000');
			should(formatter.format(1.23)).be.eql('001.23');
			should(formatter.format(12345)).be.eql('12345');
		});

		it.android('maximumFractionDigits', () => {
			const formatter = Intl.NumberFormat('en-US', {
				maximumFractionDigits: 3,
				useGrouping: false
			});
			should(formatter.format(1.2345678)).be.eql('1.235');
			should(formatter.format(-1.2345678)).be.eql('-1.235');
			should(formatter.format(123)).be.eql('123');
			should(formatter.format(0.1)).be.eql('0.1');
		});

		it.android('minimumFractionDigits', () => {
			const formatter = Intl.NumberFormat('en-US', {
				minimumFractionDigits: 3,
				useGrouping: false
			});
			should(formatter.format(123)).be.eql('123.000');
			should(formatter.format(0.1)).be.eql('0.100');
		});

		it.android('currency', () => {
			const options = {
				style: 'currency',
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
				useGrouping: true
			};
			let formatter = Intl.NumberFormat('en-US', options);
			should(formatter.format(1000)).be.eql('$1,000.00');
			formatter = Intl.NumberFormat('de-DE', options);
			should(formatter.format(1000)).be.eql('1.000,00\u00A0€');
			formatter = Intl.NumberFormat('en-US', Object.assign({ currency: 'EUR' }, options));
			should(formatter.format(1000)).be.eql('€1,000.00');
			formatter = Intl.NumberFormat('de-DE', Object.assign({ currency: 'USD' }, options));
			should(formatter.format(1000)).be.eql('1.000,00\u00A0$');
		});

		it.android('percent', () => {
			const formatter = Intl.NumberFormat('en-US', {
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

		it.android('scientific notation', () => {
			const numericValue = 1234567.8;
			let formatter = Intl.NumberFormat('en-US', { notation: 'scientific' });
			should(formatter.format(numericValue)).be.eql('1.235E6');
			formatter = Intl.NumberFormat('de-DE', { notation: 'scientific' });
			should(formatter.format(numericValue)).be.eql('1,235E6');
		});
	});

	describe.android('#formatToParts()', () => {
		it('validate function', () => {
			const formatter = new Intl.NumberFormat();
			should(formatter.formatToParts).not.be.undefined();
			should(formatter.formatToParts).be.a.Function();
			should(formatter.formatToParts(123.456)).be.an.Array();
		});

		it('decimal', () => {
			let formatter = new Intl.NumberFormat('en-US', { useGrouping: true });
			let partsArray = formatter.formatToParts(-1234567.8);
			should(partsArray[0].type).be.eql('minusSign');
			should(partsArray[0].value).be.eql('-');
			should(partsArray[1].type).be.eql('integer');
			should(partsArray[1].value).be.eql('1');
			should(partsArray[2].type).be.eql('group');
			should(partsArray[2].value).be.eql(',');
			should(partsArray[3].type).be.eql('integer');
			should(partsArray[3].value).be.eql('234');
			should(partsArray[4].type).be.eql('group');
			should(partsArray[4].value).be.eql(',');
			should(partsArray[5].type).be.eql('integer');
			should(partsArray[5].value).be.eql('567');
			should(partsArray[6].type).be.eql('decimal');
			should(partsArray[6].value).be.eql('.');
			should(partsArray[7].type).be.eql('fraction');
			should(partsArray[7].value).be.eql('8');

			formatter = new Intl.NumberFormat('de-DE', { useGrouping: true });
			partsArray = formatter.formatToParts(-1234567.8);
			should(partsArray[0].type).be.eql('minusSign');
			should(partsArray[0].value).be.eql('-');
			should(partsArray[1].type).be.eql('integer');
			should(partsArray[1].value).be.eql('1');
			should(partsArray[2].type).be.eql('group');
			should(partsArray[2].value).be.eql('.');
			should(partsArray[3].type).be.eql('integer');
			should(partsArray[3].value).be.eql('234');
			should(partsArray[4].type).be.eql('group');
			should(partsArray[4].value).be.eql('.');
			should(partsArray[5].type).be.eql('integer');
			should(partsArray[5].value).be.eql('567');
			should(partsArray[6].type).be.eql('decimal');
			should(partsArray[6].value).be.eql(',');
			should(partsArray[7].type).be.eql('fraction');
			should(partsArray[7].value).be.eql('8');
		});

		it('currency', () => {
			const options = {
				style: 'currency',
				maximumFractionDigits: 0,
				useGrouping: true
			};

			let formatter = new Intl.NumberFormat('en-US', options);
			let partsArray = formatter.formatToParts(100);
			should(partsArray[0].type).be.eql('currency');
			should(partsArray[0].value).be.eql('$');
			should(partsArray[1].type).be.eql('integer');
			should(partsArray[1].value).be.eql('100');

			formatter = new Intl.NumberFormat('de-DE', options);
			partsArray = formatter.formatToParts(100);
			should(partsArray[0].type).be.eql('integer');
			should(partsArray[0].value).be.eql('100');
			should(partsArray[1].type).be.eql('literal');
			should(partsArray[1].value).be.eql('\u00A0');  // Non-breaking space.
			should(partsArray[2].type).be.eql('currency');
			should(partsArray[2].value).be.eql('€');
		});
	});

	it('#resolvedOptions()', () => {
		const formatter = new Intl.NumberFormat();
		should(formatter.resolvedOptions).not.be.undefined();
		should(formatter.resolvedOptions).be.a.Function();
		should(formatter.resolvedOptions()).be.an.Object();
	});

	it('#supportedLocalesOf()', () => {
		should(Intl.NumberFormat.supportedLocalesOf).not.be.undefined();
		should(Intl.NumberFormat.supportedLocalesOf).be.a.Function();

		let locales = Intl.NumberFormat.supportedLocalesOf([]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(0);

		locales = Intl.NumberFormat.supportedLocalesOf([ 'en-US' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en-US');

		locales = Intl.NumberFormat.supportedLocalesOf([ 'en-US', 'de-DE' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(2);
		should(locales[0]).be.eql('en-US');
		should(locales[1]).be.eql('de-DE');

		locales = Intl.NumberFormat.supportedLocalesOf([ 'uh-oh', 'en-US' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en-US');
	});
});
