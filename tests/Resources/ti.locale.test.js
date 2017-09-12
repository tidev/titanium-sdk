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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Global', function () {
	it('L', function () {
		should(L).be.a.Function;
		// should(L).eql(Ti.Locale.getString);
	});
});

describe('Titanium.Locale', function () {

	// reset back to US english when done
	after(function () {
		Ti.Locale.setLanguage('en-US');
	});

	it('apiName', function () {
		should(Ti.Locale).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Locale.apiName).be.eql('Ti.Locale');
	});

	it('exists', function () {
		should(Ti.Locale).not.be.undefined;
		should(Ti.Locale).not.be.null;
		should(Ti.Locale).be.an.Object;
	});

	it('#getString()', function () {
		should(Ti.Locale.getString).be.a.Function;
	});

	it('#getCurrentCountry()', function () {
		should(Ti.Locale.getCurrentCountry).be.a.Function;
		should(Ti.Locale.getCurrentCountry()).eql('US');
	});

	it('#getCurrentLanguage()', function () {
		should(Ti.Locale.getCurrentLanguage).be.a.Function;
		should(Ti.Locale.getCurrentLanguage()).eql('en');
	});

	it('#getLocaleCurrencySymbol', function () {
		should(Ti.Locale.getLocaleCurrencySymbol).be.a.Function;
		should(Ti.Locale.getLocaleCurrencySymbol('en-US')).eql('$');
	});

	// FIXME Get working on iOS
	// FIXME Get working properly cross-platform. JPY gives us ¥ on Windows and Android, JP¥ on iOS. CNY gives us ¥ on Windows, CN¥ on Android
	it.androidAndIosBroken('#getCurrencySymbol(String)', function () {
		should(Ti.Locale.getCurrencySymbol).be.a.Function;
		should(Ti.Locale.getCurrencySymbol('USD')).eql('$');
		should(Ti.Locale.getCurrencySymbol('JPY')).eql('¥'); // 'JP¥' on iOS
		should(Ti.Locale.getCurrencySymbol('CNY')).eql('¥'); // 'CN¥' on Android
		should(Ti.Locale.getCurrencySymbol('TWD')).eql('NT$');
	});

	it('#getCurrencyCode(String)', function () {
		should(Ti.Locale.getCurrencyCode).be.a.Function;
		should(Ti.Locale.getCurrencyCode('en-US')).eql('USD');
		should(Ti.Locale.getCurrencyCode('ja-JP')).eql('JPY');
		should(Ti.Locale.getCurrencyCode('zh-CN')).eql('CNY');
		should(Ti.Locale.getCurrencyCode('zh-TW')).eql('TWD');
	});

	// TODO Support Ti.Locale.formatTelephoneNumber on other platforms?
	it.android('#formatTelephoneNumber(String)', function () {
		should(Ti.Locale.formatTelephoneNumber).be.a.Function;
		// TODO Actually check inputs/outputs!
	});

	it('currentCountry', function () {
		should(Ti.Locale.currentCountry).be.a.String;
		should(Ti.Locale.currentCountry).eql('US');
	});

	it('currentLanguage', function () {
		should(Ti.Locale.currentLanguage).be.a.String;
		should(Ti.Locale.currentLanguage).eql('en');
	});

	it('currentLocale', function () {
		should(Ti.Locale.currentLocale).be.a.String;
		should(Ti.Locale.currentLocale).eql('en-US');
	});

	// FIXME iOS seems to ignore position info ont he format string.
	// We're trying to force the 1st argument into the second slot, and vice versa here. iOS ahndles the %2$s syntax, but ignores position
	it.iosBroken('#getString(String, String) with String.format()', function () {
		var i18nMissingMsg = '<no translation available>';
		var string1 = 'You say ' + Ti.Locale.getString('signoff', i18nMissingMsg) + ' and I say ' + Ti.Locale.getString('greeting', i18nMissingMsg) + '!';
		var string2 = String.format(L('phrase'), L('greeting', i18nMissingMsg), L('signoff', i18nMissingMsg));

		if (Ti.Locale.currentLanguage === 'en') {
			should(string1).eql('You say goodbye and I say hello!');
			should(string2).eql('You say goodbye and I say hello!');
		} else if (Ti.Locale.currentLanguage === 'ja') {
			should(string1).eql('You say さようなら and I say こんにちは!');
			should(string2).eql('You say さようなら and I say こんにちは!');
		}
	});

	// FIXME Get working on iOS, setLangauge doesn't seem to affect currentLocale
	it.iosBroken('#setLanguage(String) changes current local and language', function () {
		should(Ti.Locale.setLanguage).be.a.Function;
		Ti.Locale.setLanguage('en-GB');
		should(Ti.Locale.currentLocale).eql('en-GB'); // iOS returns 'en-US'
		should(Ti.Locale.currentLanguage).eql('en');
		// TODO Should the currentCountry become 'GB'? Or stay 'US'?
		Ti.Locale.setLanguage('fr');
		should(Ti.Locale.currentLocale).eql('fr');
		should(Ti.Locale.currentLanguage).eql('fr');
	});

	it('#getString(String, String) with default/hint value', function () {
		Ti.Locale.setLanguage('en-US');
		should(Ti.Locale.getString('this_is_my_key')).eql('this is my value');
		// FIXME Parity issue between Android and iOS/Windows
		if (utilities.isAndroid()) {
			// Android returns null when key is not found
			should(Ti.Locale.getString('this_should_not_be_found')).be.null;
		} else {
			// if value is not found, it should return key itself
			should(Ti.Locale.getString('this_should_not_be_found')).eql('this_should_not_be_found');
		}
		// test for hint value
		should(Ti.Locale.getString('this_should_not_be_found', 'this is the default value')).eql('this is the default value');
		should(Ti.Locale.getString('this_should_not_be_found', null)).be.null;
		should(Ti.Locale.getString('this_should_not_be_found', 123)).eql(123);
	});

	it('#getString(String) with different languages', function () {
		Ti.Locale.setLanguage('en-US');
		should(Ti.Locale.getString('this_is_my_key')).eql('this is my value');
		Ti.Locale.setLanguage('en-GB');
		should(Ti.Locale.getString('this_is_my_key')).eql('this is my en-GB value');
		Ti.Locale.setLanguage('ja');
		should(Ti.Locale.getString('this_is_my_key')).eql('これは私の値です');
	});
});
