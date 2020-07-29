/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Analytics', function () {

	it('apiName', function () {
		should(Ti.Analytics).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Analytics.apiName).be.eql('Ti.Analytics');
	});

	// FIXME: this is an invalid test as lastEvent can return null or undefined if an event is not queued
	it.allBroken('lastEvent', function () {
		should(Ti.Analytics.lastEvent).not.be.undefined();
		// FIXME: iOS and Android return a JSON string value here, while Windows has an Object!
		if (utilities.isWindows()) {
			should(Ti.Analytics.lastEvent).be.a.Object();
		} else {
			should(Ti.Analytics.lastEvent).be.a.String();
		}
	});

	it('#getLastEvent()', function () {
		should(Ti.Analytics.getLastEvent).not.be.undefined();
		should(Ti.Analytics.getLastEvent).be.a.Function();
	});

	it('#featureEvent()', function () {
		should(Ti.Analytics.featureEvent).not.be.undefined();
		should(Ti.Analytics.featureEvent).be.a.Function();
	});

	// TODO: implement Titanium.Analytics.filterEvents on Windows?
	it.windowsMissing('#filterEvents()', function () {
		should(Ti.Analytics.filterEvents).not.be.undefined();
		should(Ti.Analytics.filterEvents).be.a.Function();
	});

	it('#navEvent()', function () {
		should(Ti.Analytics.navEvent).not.be.undefined();
		should(Ti.Analytics.navEvent).be.a.Function();
	});

	it('#featureEvent() validate limitations', function () {
		var payloads = require('./analytics/featureEventPayload.json'),
			tests = {
				largeInvalid: -1,
				complexInvalid: -1,
				complexValid: 0,
				maxKeysInvalid: -1
			},
			t;
		for (t in tests) {
			should(Ti.Analytics.featureEvent(t, payloads[t])).be.eql(tests[t]);
		}
	});

	it.androidMissing('.optedOut', function () {
		should(Ti.Analytics.optedOut).be.a.Boolean();
		should(Ti.Analytics.setOptedOut).be.a.Function();
		should(Ti.Analytics.getOptedOut).be.a.Function();

		should(Ti.Analytics.optedOut).eql(false);
		should(Ti.Analytics.getOptedOut()).eql(false);

		Ti.Analytics.optedOut = true;

		should(Ti.Analytics.optedOut).be.true();
		should(Ti.Analytics.getOptedOut()).be.true();

		Ti.Analytics.setOptedOut(false);

		should(Ti.Analytics.optedOut).eql(false);
		should(Ti.Analytics.getOptedOut()).eql(false);
	});
});
