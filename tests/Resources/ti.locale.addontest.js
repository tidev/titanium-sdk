/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, L */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Locale', function () {

	// reset back to US english when done
	after(function () {
		Ti.Locale.setLanguage('en-US');
	});

	it('#setLanguage(String) changes current language', function () {
		should(Ti.Locale.setLanguage).be.a.Function;
		Ti.Locale.setLanguage('fr');
		should(Ti.Locale.currentLanguage).eql('fr');
	});
});
