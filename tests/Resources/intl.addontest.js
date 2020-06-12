/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */

/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Intl', function () {
	it('#getCanonicalLocales()', () => {
		should(Intl).not.be.undefined();
		should(Intl.getCanonicalLocales).not.be.undefined();
		should(Intl.getCanonicalLocales).be.a.Function();

		let locales = Intl.getCanonicalLocales();
		should(locales).be.an.Array();
		should(locales.length).be.eql(0);

		locales = Intl.getCanonicalLocales('EN-US');
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en-US');

		locales = Intl.getCanonicalLocales([ 'EN-US' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en-US');

		locales = Intl.getCanonicalLocales([ 'EN-US', 'DE-DE' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(2);
		should(locales[0]).be.eql('en-US');
		should(locales[1]).be.eql('de-DE');

		locales = Intl.getCanonicalLocales([ 'EN-US', 'en-US' ]);
		should(locales).be.an.Array();
		should(locales.length).be.eql(1);
		should(locales[0]).be.eql('en-US');
	});
});
