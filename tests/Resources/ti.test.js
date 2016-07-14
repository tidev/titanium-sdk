/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	assert = require('./utilities/assertions');

describe('Titanium', function () {

	it('apiName', function () {
		should(Ti).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.apiName).be.eql('Ti');
	});

	// FIXME Get working on IOS!
	(utilities.isIOS() ? it.skip : it)('version', function () {
		should(Ti.version).not.eql('__TITANIUM_VERSION__');
		should(Ti).have.readOnlyProperty('version').which.is.a.String;
	});

	it('getVersion()', function () {
		should(Ti.getVersion).be.a.Function;
		should(Ti.getVersion()).be.a.String;
		should(Ti.getVersion()).not.eql('__TITANIUM_VERSION__');
		// TODO Test format of the version string. what should we expect? Something like: /\d\.\d\.\d(\.(v\d+|GA))/
	});

	// FIXME Get working on IOS!
	(utilities.isIOS() ? it.skip : it)('buildDate', function () {
		should(Ti.buildDate).not.eql('__TITANIUM_BUILD_DATE__');
		should(Ti).have.readOnlyProperty('buildDate').which.is.a.String;
		// TODO Test format of the date string. what should we expect? Android gives us: '2016/06/02 08:45'
	});

	it('getBuildDate()', function () {
		should(Ti.getBuildDate).be.a.Function;
		should(Ti.getBuildDate()).be.a.String;
		should(Ti.getBuildDate()).not.eql('__TITANIUM_BUILD_DATE__');
	});

	// FIXME Get working on IOS!
	(utilities.isIOS() ? it.skip : it)('buildHash', function () {
		should(Ti.buildHash).not.eql('__TITANIUM_BUILD_HASH__');
		should(Ti).have.readOnlyProperty('buildHash').which.is.a.String;
		// TODO Test format of the buildHash string. what should we expect? Android gives us: 'c012548'
	});

	it('getBuildHash()', function () {
		should(Ti.getBuildHash).be.a.Function;
		should(Ti.getBuildHash()).be.a.String;
		should(Ti.getBuildHash()).not.eql('__TITANIUM_BUILD_HASH__');
	});

	// FIXME File a ticket in JIRA. Updating V8 fixes the property read/write issues, but exposes bug in that we set userAgent as read-only on Android and it shouldn't be
	(utilities.isAndroid() ? it.skip : it)('userAgent', function () {
		should(Ti.userAgent).be.a.String;

		var save = Ti.userAgent;
		Ti.userAgent = 'Titanium_Mocha_Test';
		should(Ti.userAgent).be.eql('Titanium_Mocha_Test');
		Ti.userAgent = save;
		should(Ti.userAgent).be.eql(save);
	});

	it('getUserAgent()', function () {
		should(Ti.getUserAgent).be.a.Function;
		should(Ti.getUserAgent()).be.a.String;
	});

	// FIXME Get working on IOS/Android!
	((utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('setUserAgent()', function () {
		should(Ti.setUserAgent).be.a.Function;
		var save = Ti.getUserAgent();
		Ti.setUserAgent('Titanium_Mocha_Test');
		should(Ti.getUserAgent()).be.eql('Titanium_Mocha_Test');
		should(Ti.userAgent).be.eql('Titanium_Mocha_Test');
		Ti.setUserAgent(save);
		should(Ti.getUserAgent()).be.eql(save);
		should(Ti.userAgent).be.eql(save);
	});

	it('addEventListener()', function () {
		should(Ti.addEventListener).be.a.Function;
	});

	it('removeEventListener()', function () {
		should(Ti.removeEventListener).be.a.Function;
	});

	// FIXME Get working on IOS/Android!
	((utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('applyProperties()', function () {
		should(Ti.applyProperties).be.a.Function;
		Ti.mocha_test = undefined;
		should(Ti.applyProperties({ mocha_test: 'mocha_test_value' }))
		should(Ti.mocha_test !== undefined);
		should(Ti.mocha_test).be.eql('mocha_test_value');
		Ti.mocha_test = undefined;
	});

	it('createBuffer()', function () {
		should(Ti.createBuffer).be.a.Function;
	});

	// FIXME Is this really a method we want to expose on our API? Seems like it shouldn't be
	it.skip('createProxy()', function () {
		should(Ti.createProxy).be.a.Function;
	});

	it('fireEvent()', function () {
		should(Ti.fireEvent).be.a.Function;
	});
});
