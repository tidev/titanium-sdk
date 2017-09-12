/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.ios('Titanium.App.iOS', function () {
	// TIMOB-23542 test searchQuery
	it('#createSearchQuery()', function () {
		should(Ti.App.iOS.createSearchQuery).not.be.undefined;
		should(Ti.App.iOS.createSearchQuery).be.a.Function;
	});
});

describe.ios('Titanium.App.iOS.SearchQuery', function () {
	it('constructor', function () {
		var searchQuery = Ti.App.iOS.createSearchQuery({
						queryString: 'title == "Titanium*"',
						attributes: ["title", "displayName", "keywords", "contentType"]
				});
		should(searchQuery).have.readOnlyProperty('apiName').which.is.a.String;
		should(searchQuery.apiName).be.eql('Ti.App.iOS.SearchQuery');
		should(searchQuery.attributes).be.an.Array;
		should(searchQuery.attributes.length).be.eql(4);
		should(searchQuery.queryString).be.eql('title == "Titanium*"');
	});
});
