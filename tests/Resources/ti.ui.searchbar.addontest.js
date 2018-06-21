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

	it.ios('.showBookmark', function () {
		var searchBar = Ti.UI.createSearchBar({
			showBookmark: true
		});
		should(searchBar.getShowBookmark).be.a.Function;
		should(searchBar.showBookmark).be.true;
		should(searchBar.getShowBookmark()).be.true;
		searchBar.showBookmark = false;
		should(searchBar.showBookmark).be.false;
		should(searchBar.getShowBookmark()).be.fasle;
	});

	it.ios('.keyboardType', function () {
		var searchBar = Ti.UI.createSearchBar({
			keyboardType: Ti.UI.KEYBOARD_TYPE_NUMBER_PAD
		});
		should(searchBar.getKeyboardType).be.a.Function;
		should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_NUMBER_PAD);
		should(searchBar.getKeyboardType()).eql(Ti.UI.KEYBOARD_TYPE_NUMBER_PAD);
		searchBar.keyboardType = Ti.UI.KEYBOARD_TYPE_EMAIL;
		should(searchBar.keyboardType).eql(Ti.UI.KEYBOARD_TYPE_EMAIL);
		should(searchBar.getKeyboardType()).eql(Ti.UI.KEYBOARD_TYPE_EMAIL);
	});

	it.ios('.autocorrect', function () {
		var searchBar = Ti.UI.createSearchBar({
			autocorrect: true
		});
		should(searchBar.getAutocorrect).be.a.Function;
		should(searchBar.autocorrect).be.true;
		should(searchBar.getAutocorrect()).be.true;
		searchBar.autocorrect = false;
		should(searchBar.autocorrect).be.false;
		should(searchBar.getAutocorrect()).be.false;
	});

	it.ios('.autocapitalization', function () {
		var searchBar = Ti.UI.createSearchBar({
			autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_ALL
		});
		should(searchBar.getAutocapitalization).be.a.Function;
		should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);
		should(searchBar.getAutocapitalization()).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);
		searchBar.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES;
		should(searchBar.autocapitalization).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
		should(searchBar.getAutocapitalization()).eql(Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
	});

	it.ios('.keyboardAppearance', function () {
		var searchBar = Ti.UI.createSearchBar({
			keyboardAppearance: Ti.UI.KEYBOARD_APPEARANCE_LIGHT
		});
		should(searchBar.getKeyboardAppearance).be.a.Function;
		should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_LIGHT);
		should(searchBar.getKeyboardAppearance()).eql(Ti.UI.KEYBOARD_APPEARANCE_LIGHT);
		searchBar.keyboardAppearance = Ti.UI.KEYBOARD_APPEARANCE_DARK;
		should(searchBar.keyboardAppearance).eql(Ti.UI.KEYBOARD_APPEARANCE_DARK);
		should(searchBar.getKeyboardAppearance()).eql(Ti.UI.KEYBOARD_APPEARANCE_DARK);
	});

	it.ios('.style', function () {
		var searchBar = Ti.UI.createSearchBar({
			style: Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT
		});
		should(searchBar.getStyle).be.a.Function;
		should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT);
		should(searchBar.getStyle()).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_PROMINENT);
		searchBar.style = Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL;
		should(searchBar.style).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL);
		should(searchBar.getStyle()).eql(Ti.UI.iOS.SEARCH_BAR_STYLE_MINIMAL);
	});

	it.ios('.prompt', function () {
		var searchBar = Ti.UI.createSearchBar({
			prompt: 'value'
		});
		should(searchBar.getStyle).be.a.Function;
		should(searchBar.prompt).eql('value');
		should(searchBar.getPrompt()).eql('value');
		searchBar.prompt = 'another value';
		should(searchBar.prompt).eql('another value');
		should(searchBar.getPrompt()).eql('another value');
	});

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
