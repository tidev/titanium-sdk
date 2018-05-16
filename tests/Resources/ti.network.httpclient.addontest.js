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
	this.timeout(6e4);

	it.android('save response data to temp directory', function (finish) {
		var xhr = Ti.Network.createHTTPClient(),
			attempts = 3;
		xhr.setTimeout(6e4);

		xhr.onload = function (e) {
			try {
				should(e.source.responseData.nativePath).be.a.string;
				if (e.source.responseData.nativePath.includes('cache/_tmp') !== -1) {
					finish();
				} else {
					finish(new Error('not saving response data to temp directory'));
				}
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

		xhr.open('GET', 'https://www.nasa.gov/sites/default/files/thumbnails/image/sun_0.jpg');
		xhr.send();
	});
});
