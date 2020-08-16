/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.Cookie', function () {
	it('apiName', function () {
		var client = Ti.Network.createHTTPClient();
		should(client).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(client.apiName).be.eql('Ti.Network.HTTPClient');
	});

	it('#isValid()', function () {
		var cookie1 = Ti.Network.createCookie({
			domain: 'example.com',
			name: 'test_cookie',
			value: '12',
			path: '/'
		});

		var cookie2 = Ti.Network.createCookie({
			name: 'test_cookie',
			value: '12',
			path: '/'
		});

		should(cookie1.isValid()).be.true();
		should(cookie2.isValid()).be.false();
	});
});
