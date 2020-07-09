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

describe('Titanium.Network.HTTPClient', function () {
	this.timeout(6e4);

	it('TIMOB-27767 - trigger error callback for invalid URL', function (finish) {
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(6e4);

		xhr.onerror = function (e) {
			finish();
		};

		xhr.open('GET', 'https://www.google .com/'); // URL with space
		xhr.send();
	});
});
