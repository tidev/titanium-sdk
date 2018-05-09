/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.TableView', function () {
	it.windowsMissing('scrollable', function () {
		var tableView = Ti.UI.createTableView({ scrollable: false });
		should(tableView.scrollable).be.eql(false);
		tableView.scrollable = !tableView.scrollable;
		should(tableView.scrollable).be.eql(true);
	});
});
