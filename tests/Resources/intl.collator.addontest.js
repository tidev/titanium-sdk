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

describe('Intl.Collator', function () {
	it('#constructor()', () => {
		should(Intl).not.be.undefined();
		should(Intl.Collator).not.be.undefined();
		should(Intl.Collator).be.a.Function();
		should(new Intl.Collator()).be.an.Object();
		should(new Intl.Collator('en-US')).be.an.Object();
		should(new Intl.Collator([ 'en-US' ])).be.an.Object();
		should(new Intl.Collator([ 'en-US', 'de-DE' ])).be.an.Object();
		should(new Intl.Collator('en-US', { sensitivity: 'variant' })).be.an.Object();
		should(new Intl.Collator([ 'en-US' ], { sensitivity: 'variant' })).be.an.Object();
		should(new Intl.Collator([ 'en-US', 'de-DE' ], { sensitivity: 'variant' })).be.an.Object();
		should(new Intl.Collator({ sensitivity: 'variant' })).be.an.Object();
	});

	describe.android('#compare()', () => {
		it('validate function', () => {
			const formatter = new Intl.Collator();
			should(formatter.compare).not.be.undefined();
			should(formatter.compare).be.a.Function();
			should(formatter.compare('', '')).be.a.Number();
		});

		it('sensitivity - variant', () => {
			const collator = new Intl.Collator({ sensitivity: 'variant' });
			should(collator.compare('a', 'a')).be.eql(0);
			should(collator.compare('a', 'á')).not.be.eql(0);
			should(collator.compare('a', 'A')).not.be.eql(0);
			should(collator.compare('a', 'b')).not.be.eql(0);
		});

		it('sensitivity - case', () => {
			const collator = new Intl.Collator({ sensitivity: 'case' });
			should(collator.compare('a', 'a')).be.eql(0);
			should(collator.compare('a', 'á')).be.eql(0);
			should(collator.compare('a', 'A')).not.be.eql(0);
			should(collator.compare('a', 'b')).not.be.eql(0);
		});

		it('sensitivity - accent', () => {
			const collator = new Intl.Collator({ sensitivity: 'accent' });
			should(collator.compare('a', 'a')).be.eql(0);
			should(collator.compare('a', 'á')).not.be.eql(0);
			should(collator.compare('a', 'A')).be.eql(0);
			should(collator.compare('a', 'b')).not.be.eql(0);
		});

		it('sensitivity - base', () => {
			const collator = new Intl.Collator({ sensitivity: 'base' });
			should(collator.compare('a', 'a')).be.eql(0);
			should(collator.compare('a', 'á')).be.eql(0);
			should(collator.compare('a', 'A')).be.eql(0);
			should(collator.compare('a', 'b')).not.be.eql(0);
		});
	});

	it('#resolvedOptions()', () => {
		const formatter = new Intl.Collator();
		should(formatter.resolvedOptions).not.be.undefined();
		should(formatter.resolvedOptions).be.a.Function();
		should(formatter.resolvedOptions()).be.an.Object();
	});

	it('#supportedLocalesOf()', () => {
		should(Intl.Collator.supportedLocalesOf).not.be.undefined();
		should(Intl.Collator.supportedLocalesOf).be.a.Function();

		let locales = Intl.Collator.supportedLocalesOf([]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(0);

		locales = Intl.Collator.supportedLocalesOf([ 'en' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en');

		locales = Intl.Collator.supportedLocalesOf([ 'en', 'de' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(2);
		should(locales[0]).be.eql('en');
		should(locales[1]).be.eql('de');

		locales = Intl.Collator.supportedLocalesOf([ 'xx', 'en' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en');
	});
});
