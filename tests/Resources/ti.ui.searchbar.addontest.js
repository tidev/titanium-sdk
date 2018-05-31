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
	it.ios('Should be able to set/get the background image of the textfield', function () {
		var backgroundView = Ti.UI.createView({
			height: 36,
			width: Ti.Platform.displayCaps.platformWidth - 20,
			backgroundColor: '#268E8E93',
			borderRadius: 12
		});

		var searchBar = Ti.UI.createSearchBar({
			fieldBackgroundImage: backgroundView.toImage(),
			fieldBackgroundDisabledImage: backgroundView.toImage()
		});

		should(searchBar.fieldBackgroundImage.apiName).eql('Ti.Blob');
		should(searchBar.fieldBackgroundDisabledImage.apiName).eql('Ti.Blob');
	});
});
