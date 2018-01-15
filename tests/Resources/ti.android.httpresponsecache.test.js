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

describe('Titanium.Android.HttpResponseCache', function () {
	var cache = Ti.Android.HttpResponseCache;
	this.timeout(6e4);

	afterEach(function () {
		cache.flush();
		cache.remove();
	});

	it.android('apiName', function () {
		should(cache).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(cache.apiName).be.eql('Ti.Android.HttpResponseCache');
	});

	it.android('httpCachePath', function () {
		should(cache).have.property('httpCachePath').which.is.a.String;
	});

	it.android('#getHttpCachePath', function () {
		should(cache).have.property('getHttpCachePath').which.is.a.Function;
		should(cache.getHttpCachePath()).be.a.String;
	});

	it.android('httpCacheSize', function () {
		should(cache).have.property('httpCacheSize').which.is.a.Number;
	});

	it.android('#getHttpCacheSize', function () {
		should(cache).have.property('getHttpCacheSize').which.is.a.Function;
		should(cache.getHttpCacheSize()).be.a.Number;
	});

	it.android('#setHttpCachePath', function () {
		should(cache).have.property('setHttpCachePath').which.is.a.Function;
	});

	it.android('#setHttpCacheSize', function () {
		should(cache).have.property('setHttpCacheSize').which.is.a.Function;
	});

	it.android('#getHttpCacheSize', function () {
		should(cache).have.property('getHttpCacheSize').which.is.a.Function;
		should(cache.getHttpCacheSize()).be.a.Number;
	});

	it.android('#install', function () {
		should(cache).have.property('install').which.is.a.Function;
	});

	it.android('#flush', function () {
		should(cache).have.property('flush').which.is.a.Function;
	});

	it.android('#remove', function () {
		should(cache).have.property('remove').which.is.a.Function;
	});

	it.android('#close', function () {
		should(cache).have.property('close').which.is.a.Function;
	});

	it.android('#getHitCount', function () {
		should(cache).have.property('getHitCount').which.is.a.Function;
	});

	it.android('#getNetworkCount', function () {
		should(cache).have.property('getNetworkCount').which.is.a.Function;
	});

	it.android('#getRequestCount', function () {
		should(cache).have.property('getRequestCount').which.is.a.Function;
	});

	it.android('#size', function () {
		should(cache).have.property('size').which.is.a.Function;
	});

	it.android('defaultValues', function () {
		should(cache.httpCachePath).be.eql('http');
		should(cache.httpCacheSize).be.eql(25 * 1024 * 1024);
	});

	it.android('set custom properties 1', function () {
		var path = 'path_1';
		var size = 2 * 1024 * 1024;
		cache.httpCachePath = path;
		cache.httpCacheSize = size;
		should(cache.httpCachePath).be.eql(path);
		should(cache.httpCacheSize).be.eql(size);
	});

	it.android('set custom properties 2', function () {
		var path = 'path_2';
		var size = 3 * 1024 * 1024;
		cache.setHttpCachePath(path);
		cache.setHttpCacheSize(size);
		should(cache.getHttpCachePath()).be.eql(path);
		should(cache.getHttpCacheSize()).be.eql(size);
	});

	it.android('install', function () {
		var result;
		cache.setHttpCachePath('path_3');
		cache.setHttpCacheSize(30 * 1024 * 1024);
		result = cache.install();
		should(result).be.a.Boolean;
		should(result).be.true;
	});
});
