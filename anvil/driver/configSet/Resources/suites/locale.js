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
		{name: "stringPPEnhancements"}
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
}
