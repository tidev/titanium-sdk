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

	this.name = "android_string";
	this.tests = [
		{name: "stringFormatFuncs"},
		{name: "stringFormat"},
		{name: "stringFormatDate"},
		{name: "stringFormatTime"},
		{name: "stringFormatDecimal"},
		{name: "stringFormatCurrency"}
	]

	this.stringFormatFuncs = function(testRun) {
		valueOf(testRun, String).shouldBeFunction();
		valueOf(testRun, String.format).shouldBeFunction();
		valueOf(testRun, String.formatCurrency).shouldBeFunction();
		valueOf(testRun, String.formatDate).shouldBeFunction();
		valueOf(testRun, String.formatDecimal).shouldBeFunction();
		valueOf(testRun, String.formatTime).shouldBeFunction();

		finish(testRun);
	}

	this.stringFormat = function(testRun) {
		valueOf(testRun, String).shouldBeFunction();
		valueOf(testRun, String.format).shouldBeFunction();
		var formatString = "%s to %d decimal places is %1.2f";
		var resultUS = "Pi to 2 decimal places is 3.14";
		var resultCommaDecimal = "Pi to 2 decimal places is 3,14";
		var result = String.format(formatString, "Pi", 2, 22/7);
		var country;
		valueOf(testRun, function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(testRun, country).shouldBeString();
		if (country.toLowerCase() === 'us') {
			valueOf(testRun, result).shouldBe(resultUS);
		} else {
			valueOf(testRun, result === resultUS || result === resultCommaDecimal).shouldBeTrue();
		}

		finish(testRun);
	}

	this.stringFormatDate = function(testRun) {
		valueOf(testRun, String).shouldBeFunction();
		valueOf(testRun, String.formatDate).shouldBeFunction();
		var d = new Date(2015, 5, 6, 14, 22, 33); // June 6 2015, 14:22:33
		var defaultValTest;
		valueOf(testRun, function() {
			defaultValTest = String.formatDate(d);
		}).shouldNotThrowException();
		valueOf(testRun, defaultValTest).shouldBeString();
		// round-trip-able at least to month and date and last two
		// chars of year
		var newDate;
		valueOf(testRun, function() {
			newDate = new Date(defaultValTest);
		}).shouldNotThrowException();
		valueOf(testRun, newDate).shouldNotBeUndefined();
		valueOf(testRun, newDate).shouldNotBeNull();
		valueOf(testRun, newDate.constructor).shouldBe(Date);
		valueOf(testRun, newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(testRun, newDate.getDate()).shouldBe(d.getDate());
		valueOf(testRun, String(newDate.getFullYear()).substr(2, 2)).shouldBe(String(d.getFullYear()).substr(2, 2));

		// specify short format
		var shortValTest;
		valueOf(testRun, function() {
			shortValTest = String.formatDate(d, "short");
		}).shouldNotThrowException();
		valueOf(testRun, shortValTest).shouldBeString();

		// Our docs say the default is short, so this short val should be
		// same as default val from above.
		valueOf(testRun, shortValTest).shouldBe(defaultValTest);

		// round-trip-able at least to month and date and last two
		// chars of year
		newDate = null;
		valueOf(testRun, function() {
			newDate = new Date(shortValTest);
		}).shouldNotThrowException();
		valueOf(testRun, newDate).shouldNotBeUndefined();
		valueOf(testRun, newDate).shouldNotBeNull();
		valueOf(testRun, newDate.constructor).shouldBe(Date);
		valueOf(testRun, newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(testRun, newDate.getDate()).shouldBe(d.getDate());
		valueOf(testRun, String(newDate.getFullYear()).substr(2, 2)).shouldBe(String(d.getFullYear()).substr(2, 2));

		// short format shouldn't have spaces, and should either have two dots or two slashes depending on
		// locale
		var match = shortValTest.match(/[\/.]/g);
		valueOf(testRun, match).shouldNotBeNull();
		valueOf(testRun, match).shouldBeArray();
		valueOf(testRun, match.length).shouldBe(2);

		// specify medium format
		var mediumValTest;
		valueOf(testRun, function() {
			mediumValTest = String.formatDate(d, "medium");
		}).shouldNotThrowException();
		valueOf(testRun, mediumValTest).shouldBeString();
	
		// round-trip-able including full year
		newDate = null;
		valueOf(testRun, function() {
			newDate = new Date(mediumValTest);
		}).shouldNotThrowException();
		valueOf(testRun, newDate).shouldNotBeUndefined();
		valueOf(testRun, newDate).shouldNotBeNull();
		valueOf(testRun, newDate.constructor).shouldBe(Date);
		valueOf(testRun, newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(testRun, newDate.getDay()).shouldBe(d.getDay());
		valueOf(testRun, newDate.getFullYear()).shouldBe(d.getFullYear());

		// not 100% sure this is true in every locale, but would
		// expect a couple of spaces in the medium format. Medium format
		// Android en-US is "Jun 6, 2015".
		match = mediumValTest.match(/\s/g);
		valueOf(testRun, match).shouldBeArray();
		valueOf(testRun, match.length).shouldBeGreaterThanEqual(2);
		var language;
		valueOf(testRun, function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			valueOf(testRun, mediumValTest).shouldContain("Jun");
		}
		valueOf(testRun, mediumValTest).shouldContain(String(d.getDate()));
		valueOf(testRun, mediumValTest).shouldContain(String(d.getFullYear()));

		// specify long format
		var longValTest;
		valueOf(testRun, function() {
			longValTest = String.formatDate(d, "long");
		}).shouldNotThrowException();
		valueOf(testRun, longValTest).shouldBeString();

		// round-trip-able including full year
		newDate = null;
		valueOf(testRun, function() {
			newDate = new Date(longValTest);
		}).shouldNotThrowException();
		valueOf(testRun, newDate).shouldNotBeUndefined();
		valueOf(testRun, newDate).shouldNotBeNull();
		valueOf(testRun, newDate.constructor).shouldBe(Date);
		valueOf(testRun, newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(testRun, newDate.getDay()).shouldBe(d.getDay());
		valueOf(testRun, newDate.getFullYear()).shouldBe(d.getFullYear());
	
		// not 100% sure this is true in every locale, but would
		// expect a couple of spaces in the long format, plus the full
		// month name.
		// Android en-US is "June 6, 2015".
		match = longValTest.match(/\s/g);
		valueOf(testRun, match).shouldBeArray();
		valueOf(testRun, match.length).shouldBeGreaterThanEqual(2);
		var language;
		valueOf(testRun, function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			valueOf(testRun, longValTest).shouldContain("June");
		}
		valueOf(testRun, longValTest).shouldContain(String(d.getDate()));
		valueOf(testRun, longValTest).shouldContain(String(d.getFullYear()));

		finish(testRun);
	}

	this.stringFormatTime = function(testRun) {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments other than the time (i.e., no short/medium/long
		// arguments), and indeed we don't implement (at least in Android) any handling
		// for short/medium/long.
		valueOf(testRun, String).shouldBeFunction();
		valueOf(testRun, String.formatTime).shouldBeFunction();
		var d = new Date(2015, 5, 6, 14, 22, 33); // June 6 2015, 14:22:33
		var defaultValTest;
		valueOf(testRun, function() {
			defaultValTest = String.formatTime(d);
		}).shouldNotThrowException();
		valueOf(testRun, defaultValTest).shouldBeString();

		// the string format depends on locale (and maybe user settings?), but given
		// that the time entered was 14:22, we know the string should begin with
		// 14:22, 2:22 or 02:22.
		valueOf(testRun, defaultValTest.indexOf("14:22") === 0 || defaultValTest.indexOf("2:22") === 0 ||
				defaultValTest.indexOf("02:22") === 0).shouldBeTrue();

		// If the locale language is english (which it likely is when running drillbit) and
		// the string starts with "02" or "2", we expect it to end with "pm".
		var language;
		valueOf(testRun, function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			if (defaultValTest.indexOf("02") === 0 || defaultValTest.indexOf("2") === 0) {
				valueOf(testRun, defaultValTest.toLowerCase()).shouldContain("pm");
			}
		}

		finish(testRun);
	}

	this.stringFormatDecimal = function(testRun) {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments whatsoever. However, the Android
		// implementation allows any of these three formats:
		//		String.formatDecimal(2.0);
		//		String.formatDecimal(2.0, "#0"); // i.e., pattern as second arg
		//		String.formatDecimal(2.0, "de-DE"); // i.e., locale as second arg
		//		String.formatDecimal(2.0, "de-DE", "#0"); // i.e., locale as second arg and pattern as third.
		// These tests assume iOS has same implementation.
		var d = 5123.33;

		// first just be sure all the variations of calling the function are supported.
		valueOf(testRun, function() {
			String.formatDecimal(d);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			String.formatDecimal(d, "en-US");
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			String.formatDecimal(d, "#0");
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			String.formatDecimal(d, "en-US", "#0");
		}).shouldNotThrowException();

		var isUS = true;
		var country;
		valueOf(testRun, function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(testRun, country).shouldBeString();
		isUS = (country.toLowerCase() === "us");

		// One argument
		var valTest = String.formatDecimal(d);
		if (isUS) {
			valueOf(testRun, valTest).shouldBe("5,123.33");
		} else {
			// One of 5,123.33 or 5.123,33
			valueOf(testRun, valTest).shouldBeOneOf(["5,123.33", "5.123,33"]);
		}

		// Two arguments -- locale
		valTest = String.formatDecimal(d, "en-US");
		valueOf(testRun, valTest).shouldBe("5,123.33");
		// Do all devices we test on have de-DE avail? I'm taking a chance here. Could
		// be we need to rip this out.
		valTest = null;
		valueOf(testRun, function() {
			valTest = String.formatDecimal(d, "de-DE");
		}).shouldNotThrowException();
		valueOf(testRun, valTest).shouldBe("5.123,33");

		// Two arguments -- format pattern
		valTest = String.formatDecimal(d, "00,000");
		valueOf(testRun, valTest.indexOf("0")).shouldBe(0);
		if (isUS) {
			valueOf(testRun, valTest).shouldBe("05,123");
		} else {
			valueOf(testRun, valTest).shouldBeOneOf(["05,123", "05.123"]);
		}

		valTest = String.formatDecimal(d, "#");
		valueOf(testRun, valTest).shouldBe("5123");

		valTest = String.formatDecimal(d, "#.0");
		if (isUS) {
			valueOf(testRun, valTest).shouldBe("5123.3");
		} else {
			valueOf(testRun, valTest).shouldBeOneOf(["5123.3", "5123,5"]);
		}

		valTest = String.formatDecimal(d, "#,###.0000");
		if (isUS) {
			valueOf(testRun, valTest).shouldBe("5,123.3300");
		} else {
			valueOf(testRun, valTest).shouldBeOneOf(["5,123.3300", "5.123,3300"]);
		}

		// Three arguments
		// Again, assuming de-DE is available on device/simulator/emulator. If we find
		// that it's not always available, may need to rip this out.
		valTest = null;
		valTest = String.formatDecimal(d, "de-DE", "#.00");
		valueOf(testRun, valTest).shouldBe("5123,33");
		valTest = String.formatDecimal(d, "de-DE", "00,000.0");
		valueOf(testRun, valTest).shouldBe("05.123,3");
		valTest = String.formatDecimal(d, "en-US", "0.00");
		valueOf(testRun, valTest).shouldBe("5123.33");
		valTest = String.formatDecimal(d, "en-US", "00,000.0");
		valueOf(testRun, valTest).shouldBe("05,123.3");

		finish(testRun);
	}

	this.stringFormatCurrency = function(testRun) {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments other than the value to be formatted.
		// And, unlike String.formatDecimal, the Android implementation also does
		// not support any argument other than the value to be formatted.
		valueOf(testRun, String).shouldBeFunction();
		valueOf(testRun, String.formatCurrency).shouldBeFunction();
		var d = 555123.2323;
		var valTest = String.formatCurrency(d);
		var country;
		valueOf(testRun, function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(testRun, country).shouldBeString();
		if (country.toLowerCase() === "us") {
			valueOf(testRun, valTest).shouldBe("$555,123.23");
		}

		// A few Euro ones for fun, especially so Bill can test
		// on a real phone in Austria. :)
		if (["de", "at", "fr", "it", "es", "pt"].indexOf(country.toLowerCase()) >= 0) {
			valueOf(testRun, valTest.substr(0, 1)).shouldBe("€");
		}

		// In all cases, there should only be two decimal digits
		// and a thousands separator.
		var pattern = /555[.,]123[.,]23/;
		valueOf(testRun, valTest.search(pattern)).shouldBeGreaterThanEqual(0);

		finish(testRun);
	}
}
