/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.HTTPClient', function () {
	it.ios('basic-auth success', function (finish) {
		var xhr, attempts;
		this.timeout(6e4);
		xhr = Ti.Network.createHTTPClient({
			username: 'user',
			password: 'passwd'
		});
		attempts = 3;
		xhr.setTimeout(6e4);

		xhr.onload = function () {
			try {
				should(this.responseText).be.a.string;
				finish();
			} catch (err) {
				finish(err);
			}
		};
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				Ti.API.warn('failed, attempting to retry request...');
				xhr.send();
			} else {
				Ti.API.debug(JSON.stringify(e, null, 2));
				finish(new Error('failed to authenticate: ' + e));
			}
		};

		xhr.open('GET', 'http://httpbin.org/basic-auth/user/passwd');
		xhr.send();
	});

	it.ios('basic-auth failure', function (finish) {
		var xhr;
		this.timeout(6e4);
		xhr = Ti.Network.createHTTPClient({
			username: 'user',
			password: 'wrong_password',
		});
		xhr.setTimeout(6e4);

		xhr.onload = function () {
			finish(new Error('With wrong password it is authenticating'));
		};
		xhr.onerror = function () {
			// This request should fail as password is wrong.
			finish();
		};

		xhr.open('GET', 'http://httpbin.org/basic-auth/user/passwd');
		xhr.send();
	});
});
