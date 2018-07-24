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

describe.android('Titanium.Android.HttpResponseCache', function () {
	var cache = Ti.Android.HttpResponseCache;
	this.timeout(6e4);

	it('apiName', function () {
		should(cache).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(cache.apiName).be.eql('Ti.Android.HttpResponseCache');
	});

	it('path', function () {
		should(cache).have.property('path').which.is.a.String;
	});

	it('maxSize', function () {
		should(cache).have.property('maxSize').which.is.a.Number;
	});

	it('#install', function () {
		should(cache).have.property('install').which.is.a.Function;
	});

	it('#flush', function () {
		should(cache).have.property('flush').which.is.a.Function;
	});

	it('#remove', function () {
		should(cache).have.property('remove').which.is.a.Function;
	});

	it('#close', function () {
		should(cache).have.property('close').which.is.a.Function;
	});

	it('#getHitCount', function () {
		should(cache).have.property('getHitCount').which.is.a.Function;
	});

	it('#getNetworkCount', function () {
		should(cache).have.property('getNetworkCount').which.is.a.Function;
	});

	it('#getRequestCount', function () {
		should(cache).have.property('getRequestCount').which.is.a.Function;
	});

	it('#size', function () {
		should(cache).have.property('size').which.is.a.Function;
	});

	it('defaultValues', function () {
		should(cache.path).be.eql('http');
		should(cache.maxSize).be.eql(25 * 1024 * 1024);
	});

	it('set custom properties', function () {
		var path = 'path_1';
		var size = 2 * 1024 * 1024;
		cache.path = path;
		cache.maxSize = size;
		should(cache.path).be.eql(path);
		should(cache.maxSize).be.eql(size);
	});

	it('install', function () {
		var result;
		cache.path = 'path_3';
		cache.maxSize = 30 * 1024 * 1024;
		result = cache.install();
		should(result).be.a.Boolean;
		should(result).be.true;
		cache.flush();
		cache.remove();
	});
});
