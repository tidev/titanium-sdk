describe("String extensions tests", {
	stringFormatFuncs: function() {
		valueOf(String).shouldBeFunction();
		valueOf(String.format).shouldBeFunction();
		valueOf(String.formatCurrency).shouldBeFunction();
		valueOf(String.formatDate).shouldBeFunction();
		valueOf(String.formatDecimal).shouldBeFunction();
		valueOf(String.formatTime).shouldBeFunction();
	},
	stringFormat: function() {
		valueOf(String).shouldBeFunction();
		valueOf(String.format).shouldBeFunction();
		var formatString = "%s to %d decimal places is %1.2f";
		var resultUS = "Pi to 2 decimal places is 3.14";
		var resultCommaDecimal = "Pi to 2 decimal places is 3,14";
		var result = String.format(formatString, "Pi", 2, 22/7);
		var country;
		valueOf(function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(country).shouldBeString();
		if (country.toLowerCase() === 'us') {
			valueOf(result).shouldBe(resultUS);
		} else {
			valueOf(result === resultUS || result === resultCommaDecimal).shouldBeTrue();
		}
	},
	stringFormatDate: function() {
		valueOf(String).shouldBeFunction();
		valueOf(String.formatDate).shouldBeFunction();
		var d = new Date(2015, 5, 6, 14, 22, 33); // June 6 2015, 14:22:33
		var defaultValTest;
		valueOf(function() {
			defaultValTest = String.formatDate(d);
		}).shouldNotThrowException();
		valueOf(defaultValTest).shouldBeString();
		// round-trip-able at least to month and date and last two
		// chars of year
		var newDate;
		valueOf(function() {
			newDate = new Date(defaultValTest);
		}).shouldNotThrowException();
		valueOf(newDate).shouldNotBeUndefined();
		valueOf(newDate).shouldNotBeNull();
		valueOf(newDate.constructor).shouldBe(Date);
		valueOf(newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(newDate.getDate()).shouldBe(d.getDate());
		valueOf(String(newDate.getFullYear()).substr(2, 2)).shouldBe(String(d.getFullYear()).substr(2, 2));

		// specify short format
		var shortValTest;
		valueOf(function() {
			shortValTest = String.formatDate(d, "short");
		}).shouldNotThrowException();
		valueOf(shortValTest).shouldBeString();

		// Our docs say the default is short, so this short val should be
		// same as default val from above.
		valueOf(shortValTest).shouldBe(defaultValTest);

		// round-trip-able at least to month and date and last two
		// chars of year
		newDate = null;
		valueOf(function() {
			newDate = new Date(shortValTest);
		}).shouldNotThrowException();
		valueOf(newDate).shouldNotBeUndefined();
		valueOf(newDate).shouldNotBeNull();
		valueOf(newDate.constructor).shouldBe(Date);
		valueOf(newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(newDate.getDate()).shouldBe(d.getDate());
		valueOf(String(newDate.getFullYear()).substr(2, 2)).shouldBe(String(d.getFullYear()).substr(2, 2));

		// short format shouldn't have spaces, and should either have two dots or two slashes depending on
		// locale
		var match = shortValTest.match(/[\/.]/g);
		valueOf(match).shouldNotBeNull();
		valueOf(match).shouldBeArray();
		valueOf(match.length).shouldBe(2);

		// specify medium format
		var mediumValTest;
		valueOf(function() {
			mediumValTest = String.formatDate(d, "medium");
		}).shouldNotThrowException();
		valueOf(mediumValTest).shouldBeString();
	
		// round-trip-able including full year
		newDate = null;
		valueOf(function() {
			newDate = new Date(mediumValTest);
		}).shouldNotThrowException();
		valueOf(newDate).shouldNotBeUndefined();
		valueOf(newDate).shouldNotBeNull();
		valueOf(newDate.constructor).shouldBe(Date);
		valueOf(newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(newDate.getDay()).shouldBe(d.getDay());
		valueOf(newDate.getFullYear()).shouldBe(d.getFullYear());

		// not 100% sure this is true in every locale, but would
		// expect a couple of spaces in the medium format.  medium format
		// Android en-US is "Jun 6, 2015".
		match = mediumValTest.match(/\s/g);
		valueOf(match).shouldBeArray();
		valueOf(match.length).shouldBeGreaterThanEqual(2);
		var language;
		valueOf(function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			valueOf(mediumValTest).shouldContain("Jun");
		}
		valueOf(mediumValTest).shouldContain(String(d.getDate()));
		valueOf(mediumValTest).shouldContain(String(d.getFullYear()));

		// specify long format
		var longValTest;
		valueOf(function() {
			longValTest = String.formatDate(d, "long");
		}).shouldNotThrowException();
		valueOf(longValTest).shouldBeString();

		// round-trip-able including full year
		newDate = null;
		valueOf(function() {
			newDate = new Date(longValTest);
		}).shouldNotThrowException();
		valueOf(newDate).shouldNotBeUndefined();
		valueOf(newDate).shouldNotBeNull();
		valueOf(newDate.constructor).shouldBe(Date);
		valueOf(newDate.getMonth()).shouldBe(d.getMonth());
		valueOf(newDate.getDay()).shouldBe(d.getDay());
		valueOf(newDate.getFullYear()).shouldBe(d.getFullYear());
	
		// not 100% sure this is true in every locale, but would
		// expect a couple of spaces in the long format, plus the full
		// month name.
		// Android en-US is "June 6, 2015".
		match = longValTest.match(/\s/g);
		valueOf(match).shouldBeArray();
		valueOf(match.length).shouldBeGreaterThanEqual(2);
		var language;
		valueOf(function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			valueOf(longValTest).shouldContain("June");
		}
		valueOf(longValTest).shouldContain(String(d.getDate()));
		valueOf(longValTest).shouldContain(String(d.getFullYear()));
	},

	stringFormatTime: function() {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments other than the time (i.e., no short/medium/long
		// arguments), and indeed we don't implement (at least in Android) any handling
		// for short/medium/long.
		valueOf(String).shouldBeFunction();
		valueOf(String.formatTime).shouldBeFunction();
		var d = new Date(2015, 5, 6, 14, 22, 33); // June 6 2015, 14:22:33
		var defaultValTest;
		valueOf(function() {
			defaultValTest = String.formatTime(d);
		}).shouldNotThrowException();
		valueOf(defaultValTest).shouldBeString();

		// the string format depends on locale (and maybe user settings?), but given
		// that the time entered was 14:22, we know the string should begin with
		// 14:22, 2:22 or 02:22.
		valueOf(defaultValTest.indexOf("14:22") === 0 || defaultValTest.indexOf("2:22") === 0 ||
				defaultValTest.indexOf("02:22") === 0).shouldBeTrue();

		// If the locale language is english (which it likely is when running drillbit) and
		// the string starts with "02" or "2", we expect it to end with "pm".
		var language;
		valueOf(function() {
			language = Ti.Locale.currentLanguage;
		}).shouldNotThrowException();
		if (language.toLowerCase() === "en") {
			if (defaultValTest.indexOf("02") === 0 || defaultValTest.indexOf("2") === 0) {
				valueOf(defaultValTest.toLowerCase()).shouldContain("pm");
			}
		}
	},

	stringFormatDecimal: function() {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments whatsoever.  However, the Android
		// implementation allows any of these three formats:
		//		String.formatDecimal(2.0);
		//		String.formatDecimal(2.0, "#0"); // i.e., pattern as second arg
		//		String.formatDecimal(2.0, "de-DE"); // i.e., locale as second arg
		//		String.formatDecimal(2.0, "de-DE", "#0"); // i.e., locale as second arg and pattern as third.
		// These tests assume iOS has same implementation.
		var d = 5123.33;

		// first just be sure all the variations of calling the function are supported.
		valueOf(function() {
			String.formatDecimal(d);
		}).shouldNotThrowException();
		valueOf(function() {
			String.formatDecimal(d, "en-US");
		}).shouldNotThrowException();
		valueOf(function() {
			String.formatDecimal(d, "#0");
		}).shouldNotThrowException();
		valueOf(function() {
			String.formatDecimal(d, "en-US", "#0");
		}).shouldNotThrowException();

		var isUS = true;
		var country;
		valueOf(function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(country).shouldBeString();
		isUS = (country.toLowerCase() === "us");

		// One argument
		var valTest = String.formatDecimal(d);
		if (isUS) {
			valueOf(valTest).shouldBe("5,123.33");
		} else {
			// One of 5,123.33 or 5.123,33
			valueOf(valTest).shouldBeOneOf(["5,123.33", "5.123,33"]);
		}

		// Two arguments -- locale
		valTest = String.formatDecimal(d, "en-US");
		valueOf(valTest).shouldBe("5,123.33");
		// Do all devices we test on have de-DE avail? I'm taking a chance here.  Could
		// be we need to rip this out.
		valTest = null;
		valueOf(function() {
			valTest = String.formatDecimal(d, "de-DE");
		}).shouldNotThrowException();
		valueOf(valTest).shouldBe("5.123,33");

		// Two arguments -- format pattern
		valTest = String.formatDecimal(d, "00,000");
		valueOf(valTest.indexOf("0")).shouldBe(0);
		if (isUS) {
			valueOf(valTest).shouldBe("05,123");
		} else {
			valueOf(valTest).shouldBeOneOf(["05,123", "05.123"]);
		}

		valTest = String.formatDecimal(d, "#");
		valueOf(valTest).shouldBe("5123");

		valTest = String.formatDecimal(d, "#.0");
		if (isUS) {
			valueOf(valTest).shouldBe("5123.3");
		} else {
			valueOf(valTest).shouldBeOneOf(["5123.3", "5123,5"]);
		}

		valTest = String.formatDecimal(d, "#,###.0000");
		if (isUS) {
			valueOf(valTest).shouldBe("5,123.3300");
		} else {
			valueOf(valTest).shouldBeOneOf(["5,123.3300", "5.123,3300"]);
		}

		// Three arguments
		// Again, assuming de-DE is available on device/simulator/emulator.  If we find
		// that it's not always available, may need to rip this out.
		valTest = null;
        valTest = String.formatDecimal(d, "de-DE", "#.00");
        valueOf(valTest).shouldBe("5123,33");
        valTest = String.formatDecimal(d, "de-DE", "00,000.0");
        valueOf(valTest).shouldBe("05.123,3");
        valTest = String.formatDecimal(d, "en-US", "0.00");
        valueOf(valTest).shouldBe("5123.33");
        valTest = String.formatDecimal(d, "en-US", "00,000.0");
        valueOf(valTest).shouldBe("05,123.3");
	},

    stringFormatCurrency: function() {
		// Our documentation (the notes of the Titanium module documentation)
		// doesn't indicate any arguments other than the value to be formatted.
        // And, unlike String.formatDecimal, the Android implementation also does
        // not support any argument other than the value to be formatted.
		valueOf(String).shouldBeFunction();
		valueOf(String.formatCurrency).shouldBeFunction();
        var d = 555123.2323;
        var valTest = String.formatCurrency(d);
		var country;
		valueOf(function() {
			country = Ti.Locale.currentCountry;
		}).shouldNotThrowException();
		valueOf(country).shouldBeString();
        if (country.toLowerCase() === "us") {
            valueOf(valTest).shouldBe("$555,123.23");
        }

        // A few Euro ones for fun, especially so Bill can test
        // on a real phone in Austria. :)
        if (["de", "at", "fr", "it", "es", "pt"].indexOf(country.toLowerCase()) >= 0) {
            valueOf(valTest.substr(0, 1)).shouldBe("€");
        }

        // In all cases, there should only be two decimal digits
        // and a thousands separator.
        var pattern = /555[.,]123[.,]23/;
        valueOf(valTest.search(pattern)).shouldBeGreaterThanEqual(0);
    }

});
