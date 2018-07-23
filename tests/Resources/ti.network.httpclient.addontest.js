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

	it.android('HttpResponseCache xhr.cache default', function (finish) {
		var cache = Ti.Android.HttpResponseCache,
			url = 'http://www.httpbin.org/etag/default' + Math.random(),
			xhr = Ti.Network.createHTTPClient(),
			attempts = 3;

		cache.path = 'path_4';
		cache.maxSize = 30 * 1024 * 1024;
		cache.install();

		xhr.setTimeout(6e4);
		xhr.onload = function () {
			should(cache.getRequestCount()).be.eql(0);
			should(cache.getHitCount()).be.eql(0);
			finish();
		};
		xhr.onerror = function (e) {
			if (attempts-- > 0) {
				Ti.API.warn('failed, attempting to retry request...');
				xhr.send();
			} else {
				Ti.API.debug(JSON.stringify(e, null, 2));
				finish(new Error('failed to "' + url + '": ' + e));
			}
		};

		xhr.open('GET', url);
		xhr.send();
	});

	it.android('HttpResponseCache xhr.cache custom', function (finish) {
		var cache = Ti.Android.HttpResponseCache,
			url = 'http://www.httpbin.org/etag/custom' + Math.random();

		cache.path = 'path_5';
		cache.maxSize = 30 * 1024 * 1024;
		cache.install();

		function makeRequest(url, params, callback) {
			var xhr = Ti.Network.createHTTPClient(params);
			var attempts = 3;
			xhr.setTimeout(6e4);

			xhr.onload = function () {
				callback(null);
			};
			xhr.onerror = function (e) {
				if (attempts-- > 0) {
					Ti.API.warn('failed, attempting to retry request...');
					xhr.send();
				} else {
					Ti.API.debug(JSON.stringify(e, null, 2));
					callback(new Error('failed to "' + url + '": ' + e));
				}
			};

			xhr.open('GET', url);
			xhr.send();
		}

		makeRequest(url, { cache: true }, function (err) {
			if (err) {
				return finish(err);
			}
			should(cache.getRequestCount()).be.eql(1);
			makeRequest(url, { cache: false }, function (err) {
				if (err) {
					return finish(err);
				}
				should(cache.getRequestCount()).be.eql(1);
				makeRequest(url, { cache: true }, function (err) {
					if (err) {
						return finish(err);
					}
					should(cache.getRequestCount()).be.eql(2);
					should(cache.getHitCount()).be.eql(1);
					finish();
				});
			});
		});
	});
});
