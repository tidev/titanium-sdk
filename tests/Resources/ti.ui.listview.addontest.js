/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.ListView', function () {

	it.android('Ti.UI.ListView.fastScroll', function () {
		var listView = Ti.UI.createListView();
		should(listView.fastScroll).be.eql(false);
		should(listView.setFastScroll).be.a.Function;
	});
});
