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

describe('Titanium', () => {
	it('apiName', () => {
		should(Ti).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.apiName).be.eql('Ti');
	});

	it('version', () => {
		should(Ti).have.readOnlyProperty('version').which.is.a.String();
		should(Ti.version).not.eql('__VERSION__'); // This is the placeholder value used in iOS, let's ensure we replaced it!
		should(Ti.version).match(/\d+\.\d+\.\d+/); // i.e. '9.0.0' (the short version string, no timestamp qualifier)
		// Build plugin "mocha.test.support" stores SDK version to app properties.
		should(Ti.version).eql(Ti.App.Properties.getString('Ti.version'));
	});

	it('#getVersion()', () => {
		should(Ti.getVersion).be.a.Function();
		should(Ti.getVersion()).eql(Ti.version);
	});

	it('buildDate', () => {
		should(Ti).have.readOnlyProperty('buildDate').which.is.a.String();
		should(Ti.buildDate).not.eql('__TIMESTAMP__'); // This is the placeholder value used in iOS, let's ensure we replaced it!
		should(Ti.buildDate).match(/[01]?\d\/[0123]?\d\/20\d{2} \d{2}:\d{2}/); // i.e. '4/14/2020 18:48'
	});

	it('#getBuildDate()', () => {
		should(Ti.getBuildDate).be.a.Function();
		should(Ti.getBuildDate()).eql(Ti.buildDate);
	});

	it('buildHash', () => {
		should(Ti).have.readOnlyProperty('buildHash').which.is.a.String();
		should(Ti.buildHash).not.eql('__GITHASH__'); // This is the placeholder value used in iOS, let's ensure we replaced it!
		should(Ti.buildHash).match(/[a-f0-9]{10}/); // 10-character git sha
	});

	it('#getBuildHash()', () => {
		should(Ti.getBuildHash).be.a.Function();
		should(Ti.getBuildHash()).eql(Ti.buildHash);
	});

	// FIXME File a ticket in JIRA. Updating V8 fixes the property read/write issues, but exposes bug in that we set userAgent as read-only on Android and it shouldn't be
	it.androidBroken('userAgent', function () {
		should(Ti.userAgent).be.a.String();

		const save = Ti.userAgent;
		Ti.userAgent = 'Titanium_Mocha_Test';
		should(Ti.userAgent).be.eql('Titanium_Mocha_Test');
		Ti.userAgent = save;
		should(Ti.userAgent).be.eql(save);
	});

	it('#getUserAgent()', () => {
		should(Ti.getUserAgent).be.a.Function();
		should(Ti.getUserAgent()).eql(Ti.userAgent);
	});

	// FIXME Get working on IOS/Android!
	it.androidAndIosBroken('#setUserAgent()', function () {
		should(Ti.setUserAgent).be.a.Function();
		var save = Ti.getUserAgent();
		Ti.setUserAgent('Titanium_Mocha_Test');
		should(Ti.getUserAgent()).be.eql('Titanium_Mocha_Test');
		should(Ti.userAgent).be.eql('Titanium_Mocha_Test');
		Ti.setUserAgent(save);
		should(Ti.getUserAgent()).be.eql(save);
		should(Ti.userAgent).be.eql(save);
	});

	it('#addEventListener()', () => should(Ti.addEventListener).be.a.Function());

	it('#removeEventListener()', () => should(Ti.removeEventListener).be.a.Function());

	// FIXME Get working on IOS/Android!
	it.androidAndIosBroken('#applyProperties()', function () {
		should(Ti.applyProperties).be.a.Function();
		Ti.mocha_test = undefined;
		should(Ti.applyProperties({ mocha_test: 'mocha_test_value' }));
		should(Ti.mocha_test !== undefined);
		should(Ti.mocha_test).be.eql('mocha_test_value');
		Ti.mocha_test = undefined;
	});

	it('#createBuffer()', () => should(Ti.createBuffer).be.a.Function());
	it('#fireEvent()', () => should(Ti.fireEvent).be.a.Function());
});
