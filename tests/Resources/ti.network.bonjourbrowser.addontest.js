/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Network.BonjourBrowser', () => {
	const browser = Titanium.Network.createBonjourBrowser();

	it('.apiName', () => {
		should(browser).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(browser.apiName).be.eql('Titanium.Network.BonjourBrowser');
	});

	describe('.domain', () => {
		it('is a String', () => {
			should(browser).have.a.property('domain').which.is.a.String;
		});

		it('defaults to \'local.\'', () => {
			should(browser.domain).eql('local.');
		});
	});

	describe('.isSearching', () => {
		it('is a Boolean', () => {
			should(browser).have.a.property('isSearching').which.is.a.Boolean;
		});

		it('defaults to false', () => {
			should(browser.isSearching).eql(false);
		});
	});

	describe('.serviceType', () => {
		// eslint-disable-next-line mocha/no-identical-title
		it('is a String', () => {
			should(browser).have.a.property('serviceType').which.is.a.String;
		});

		// eslint-disable-next-line mocha/no-identical-title
		it('defaults to null', () => {
			// TODO: Typically this would be something like '_http._tcp' or '._tcp'
			// see https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/NetServices/Articles/domainnames.html#//apple_ref/doc/uid/TP40002460-SW1
			// https://jonathanmumm.com/tech-it/mdns-bonjour-bible-common-service-strings-for-various-vendors/
			should(browser.serviceType).eql(null);
		});
	});

	describe('#search()', () => {
		it('is a Function', () => {
			should(browser).have.a.property('search').which.is.a.Function;
		});

		it('throws if not given serviceType', () => {
			(() => browser.search()).should.throw('Service type not set');
		});
		// TODO: test isSearching property after launching search, then stop, check again
	});

	describe('#stopSearch()', () => {
		// eslint-disable-next-line mocha/no-identical-title
		it('is a Function', () => {
			should(browser).have.a.property('stopSearch').which.is.a.Function;
		});
	});
});
