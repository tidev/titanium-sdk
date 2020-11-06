/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.ios('Titanium.App.iOS.SearchQuery', function () {

	var searchQuery;

	before(function () {
		searchQuery = Ti.App.iOS.createSearchQuery({
			queryString: 'title == "Titanium*"',
			attributes: [ 'title', 'displayName', 'keywords', 'contentType' ]
		});
	});

	after(function () {
		searchQuery = null;
	});

	it('constructor', function () {
		should(searchQuery).have.readOnlyProperty('apiName').which.is.a.String();
		should(searchQuery.apiName).be.eql('Ti.App.iOS.SearchQuery');
		should(searchQuery.attributes).be.an.Array();
		should(searchQuery.attributes.length).be.eql(4);
		should(searchQuery.queryString).be.eql('title == "Titanium*"');
	});

	it('#start()', function () {
		should(searchQuery.start).be.a.Function();
	});

	it('#cancel()', function () {
		should(searchQuery.cancel).be.a.Function();
	});

	it('#isCancelled()', function () {
		should(searchQuery.isCancelled).be.a.Function();
		should(searchQuery.isCancelled()).be.a.Boolean();
	});
});
