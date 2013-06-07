/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "locale";
	this.tests = [
		{name: "localePPEnhancements"},
		{name: "localeFormatTelephoneNumber"},
		{name: "stringPPEnhancements"},
		{name: "stringFormatDateTime"}
	]

	this.localePPEnhancements = function(testRun) {
		valueOf(testRun, Ti.Locale.getCurrentLanguage()).shouldBe('en');
		valueOf(testRun, Ti.Locale.getCurrentCountry().search(/^[A-Z]{2}$/)).shouldBeGreaterThanEqual(0);
		var x = Ti.Locale.getCurrentLocale();
		valueOf(testRun, x.search(/^[a-z]{2}$/)>=0 || x.search(/^[a-z]{2}\-[A-Z]{2}$/)>=0).shouldBeTrue();
		valueOf(testRun, Ti.Locale.getCurrencyCode('en-US')).shouldBe('USD');
		valueOf(testRun, Ti.Locale.getCurrencySymbol('USD')).shouldBe('$');
		valueOf(testRun, Ti.Locale.getLocaleCurrencySymbol('en-US')).shouldBe('$');

		finish(testRun);
	}

	this.stringPPEnhancements = function(testRun) {
		valueOf(testRun, String.formatDecimal(2.5)).shouldBe('2.5');
		valueOf(testRun, String.formatDecimal(2.5, '000.000')).shouldBe('002.500');
		valueOf(testRun, String.formatDecimal(2.5, 'de-DE')).shouldBe('2,5');
		valueOf(testRun, String.formatDecimal(2.5, 'de-DE', '000.0000')).shouldBe('002,5000');

		finish(testRun);
	}

	this.localeFormatTelephoneNumber = function(testRun) {
		valueOf(testRun, Ti.Locale.formatTelephoneNumber('+3-8-0-6-6-5-5-5-2-2-1-1')).shouldBe('+380665552211');
		valueOf(testRun, Ti.Locale.formatTelephoneNumber('211')).shouldBe('211'); //invalid number
		valueOf(testRun, Ti.Locale.formatTelephoneNumber('+17327572923')).shouldBe('+1-732-757-2923');
		valueOf(testRun, Ti.Locale.formatTelephoneNumber('+810223231234')).shouldBe('+810223231234'); // wrong JP number
		valueOf(testRun, Ti.Locale.formatTelephoneNumber('+81528323123')).shouldBe('+8152-832-3123'); // valid JP number

		finish(testRun);
	}

	this.stringFormatDateTime = function(testRun) {
		var d = new Date(2013, 1, 1, 01, 02, 03, 04);

		valueOf(testRun, Ti.Locale.getCurrentLanguage()).shouldBe('en');
		valueOf(testRun, Ti.Locale.getCurrentLocale()).shouldBe('en-US');
		valueOf(testRun, String.formatTime(d)).shouldBe(String.formatTime(d, 'short'));
		valueOf(testRun, String.formatDate(d)).shouldBe(String.formatDate(d, 'short'));

		if (Ti.Platform.osname === 'tizen' || Ti.Platform.osname === 'mobileweb') {
			valueOf(testRun, String.formatDate(d, 'long')).shouldBe('Friday, February 01, 2013');
			valueOf(testRun, String.formatDate(d, 'short')).shouldBe('2/1/2013');
			valueOf(testRun, String.formatTime(d, 'long')).shouldBe('1:02:03 AM');
			valueOf(testRun, String.formatTime(d, 'short')).shouldBe('1:02 AM');
		} else {
			valueOf(testRun, String.formatDate(d, 'long')).shouldBe('February 01, 2013'); 
			valueOf(testRun, String.formatDate(d, 'short')).shouldBe('02/01/13'); 
			valueOf(testRun, String.formatTime(d, 'long')).shouldBe('1:02:03AM'); 
			valueOf(testRun, String.formatTime(d, 'short')).shouldBe('1:02AM'); 
		}

		finish(testRun);
	}
}