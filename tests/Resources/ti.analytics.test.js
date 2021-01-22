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

describe('Titanium.Analytics', () => {

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a read-only String', () => {
				should(Ti.Analytics).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals \'Ti.Analytics\'', () => {
				should(Ti.Analytics.apiName).be.eql('Ti.Analytics');
			});

			it('has a getter', () => {
				should(Ti.Analytics).have.a.getter('apiName');
			});
		});

		describe('.lastEvent', () => {
			// FIXME: this is an invalid test as lastEvent can return null or undefined if an event is not queued
			it.allBroken('is a read-only String', () => {
				should(Ti.Analytics).have.a.readOnlyProperty('lastEvent').which.is.a.String();
			});

			it('has a getter', () => {
				should(Ti.Analytics).have.a.getter('lastEvent');
			});
		});

		describe('.optedOut', () => {
			it('is a Boolean', () => {
				should(Ti.Analytics).have.a.property('optedOut').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Analytics.optedOut).be.false();
			});

			it('can be assigned a Boolean value', () => {
				Ti.Analytics.optedOut = true;
				should(Ti.Analytics.optedOut).be.true();
			});

			it('has accessors', () => {
				should(Ti.Analytics).have.accessors('optedOut');
			});
		});
	});

	describe('methods', () => {
		describe('#featureEvent()', () => {
			it('is a Function', () => {
				should(Ti.Analytics).have.a.property('featureEvent').which.is.a.Function();
			});

			it('validate limitations', () => {
				const payloads = require('./analytics/featureEventPayload.json');
				const tests = {
					largeInvalid: -1,
					complexInvalid: -1,
					complexValid: 0,
					maxKeysInvalid: -1
				};
				for (const t in tests) {
					should(Ti.Analytics.featureEvent(t, payloads[t])).be.eql(tests[t]);
				}
			});
		});

		it.windowsMissing('#filterEvents() is a Function', () => {
			should(Ti.Analytics).have.a.property('filterEvents').which.is.a.Function();
		});

		it('#navEvent() is a Function', () => {
			should(Ti.Analytics).have.a.property('navEvent').which.is.a.Function();
		});
	});
});
