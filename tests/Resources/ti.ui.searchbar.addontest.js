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

describe('Titanium.UI.SearchBar', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// TODO: Expose Windows as well
	// We have in in Ti.UI.Android.SearchView for Android, but need more parity here
	it.windowsMissing('.hintTextColor', function () {
		var searchBar = Ti.UI.createSearchBar({
			hintText: 'Enter E-Mail ...',
			hintTextColor: 'red'
		});
		should(searchBar.getHintTextColor).be.a.Function;
		should(searchBar.hintTextColor).eql('red');
		should(searchBar.getHintTextColor()).eql('red');
		searchBar.hintTextColor = 'blue';
		should(searchBar.hintTextColor).eql('blue');
		should(searchBar.getHintTextColor()).eql('blue');
	});

	// TODO: Expose Windows as well
	it.windowsMissing('.color', function () {
		var searchBar = Ti.UI.createSearchBar({
			color: 'red'
		});
		should(searchBar.getColor).be.a.Function;
		should(searchBar.color).eql('red');
		should(searchBar.getColor()).eql('red');
		searchBar.color = 'blue';
		should(searchBar.color).eql('blue');
		should(searchBar.getColor()).eql('blue');
	});
});
