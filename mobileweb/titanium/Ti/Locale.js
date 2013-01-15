define(["require", "Ti/_/lang", "Ti/_/Evented", "Ti/API"],
	function(require, lang, Evented, API) {

	var locale = lang.val(navigator.language,navigator.browserLanguage).replace(/^([^\-\_]+)[\-\_](.+)?$/, function(o, l, c){ return l.toLowerCase() + (c && "-" + c.toUpperCase()); }),
		languageParts = locale.split("-"),
		language = languageParts[0],
		strings = {},
		cfg = require.config,
		app = cfg.app, 
		// Lazily loaded object with all available locale data for numbers and currencies.
		localeNumberCurrencyInfo = null,
		// Lazily loaded object with formatting rules for date/time.
		localeCalendarInfo = null,
		// Lazily loaded object with functions to format decimals, currency, etc. 
		formatterHelpers = null, 
		// Lazily loaded object with functions to format phone numbers.
		phoneFormatter = null;

	// Add `dir` attribute to set text direction for language
	document.body.dir = /^ar|he$/.test(language) ? 'RTL' : 'LTR';

	document.title = app.name = app.names[language] || app.name;

	try {
		~cfg.locales.indexOf(language) && (strings = require("./Locale/" + language + "/i18n"));
	} catch (e) {}

	function getString(key, hint) {
		return strings[key] || hint || key || "";
	}

	Object.defineProperty(window, "L", { value: getString, enumarable: true });

	// Lazy initialization of Phone number formatter
	function initPhoneFormatter(){
		if (!phoneFormatter) phoneFormatter = require("Ti/_/Locale/PhoneFormatter");
	}

	// Lazy initialization of locale oriented formatters.
	function initFormatterHelpers(){
		if (!formatterHelpers)  formatterHelpers = require("Ti/_/Locale/FormatterHelpers");
	}

	// Lazy initialization of locale number and currency format storage.
	function initNumberCurrencyFormat(){
		if (!localeNumberCurrencyInfo) localeNumberCurrencyInfo = require("Ti/_/Locale/NumberCurrencyFormatStorage");
	}

	// Lazy initialization of locale number and currency format storage.
	function initCurrentCalendarData(){
		if (!localeCalendarInfo) {
			localeCalendarInfo = require("Ti/_/Locale/Calendar/"+locale);
			//if we did not loaded valid calendar with patterns - try load it from general
			// Example: if no "ru-RU.js" file we can try to load "ru.js"
			if (!localeCalendarInfo || !localeCalendarInfo.patterns){
				localeCalendarInfo = require("Ti/_/Locale/Calendar/"+(locale.split('-')[0]));
			}
		}

		//if we can't load target's locale calendar - use the default (en-US)
		if (!localeCalendarInfo || !localeCalendarInfo.patterns)
		{
			localeCalendarInfo = require("Ti/_/Locale/defaultCalendar");

			// if the locale wanted by the user is not en-US, warn them
			if (locale!="en-US") API.warn("Loading default locale (en-US) instead of "+locale);
		}
	}

	// Expands a format name (for example, "d" or "D") into the full pattern string.
	function expandFormat( cal, format ) {
		return cal.patterns[ format ];
	};

	// Format a date into a locale specific date format. Optionally pass a second argument (string) as either "short" (default), "medium" or "long" for controlling the date format.
	String.formatDate = function(dt, fmt) {
		// For now "MEDIUM" value of format not supported! Only short - "d", and long - "D"
		initFormatterHelpers();
		initCurrentCalendarData();

		if (!localeCalendarInfo){
			API.warn("Calendar info for locale '"+locale+"' is not loaded. Formatting date with default JS functions.");
			return [('0'+dt.getDate()).slice(-2),('0'+(dt.getMonth()+1)).slice(-2),dt.getFullYear()].join('/');
		}
		else
			return formatterHelpers.formatDate(dt, expandFormat(localeCalendarInfo, (fmt == "long")?"D":"d"), localeCalendarInfo);
	};

	// Format a date into a locale specific time format.
	String.formatTime = function(dt, fmt) {
		// For now "MEDIUM" value of format not supported! Only short - "t", and long - "T"
		initFormatterHelpers();
		initCurrentCalendarData();

		if (!localeCalendarInfo){
			API.warn("Calendar info for locale '"+locale+"' is not loaded. Formatting time with default JS functions.");
			return [('0'+dt.getHours()).slice(-2),('0'+dt.getMinutes()).slice(-2),('0'+dt.getSeconds()).slice(-2)].join(':');
		}
		else
			return formatterHelpers.formatDate(dt, expandFormat(localeCalendarInfo, (fmt == "long")?"T":"t"), localeCalendarInfo);
	};

	// Format a number into a locale specific currency format. 
	String.formatCurrency = function(amt) {
		initNumberCurrencyFormat();
		initFormatterHelpers();
		return formatterHelpers.formatCurrency(amt, localeNumberCurrencyInfo.getCurrencyInfoByLocale(locale)) || amt;
	};

	// Format a number into a locale specific decimal format. May use a number pattern.
	// According to the documentation, both parameters - localeName and pattern - are optional.
	// So if the second parameter is not a valid locale name,  it will be used as a pattern.
	String.formatDecimal = function(numberValue, localeName, pattern) {

		// Function checks the locale name according to basic rfc4647 validation rules, 
		// with advanced validation of the first sub-tag.
		// It does not validate name against ISO 639-1, ISO 639-2, ISO 639-3 and ISO 639-5.
		function isValidLocaleName(localeName) {
			var rfc4647Basic = "^([A-Za-z]{2,3}|([xX])|([iI]))(-[A-Za-z0-9]{1,8})*$"; //we accept only 2 letters code too.
			return (('' + localeName).match(rfc4647Basic) != null);
		};
		if (!pattern) {
			// In this case, parameter named as localName can be a pattern.
			if (localeName) {
				if (!isValidLocaleName(localeName)) {
					//if second parameter is NOT valid locale name - it is is a pattern.
					pattern = localeName;
					localeName = undefined;
				}
			}
		}
		// If a locale was not specified in the parameters, use current.
		if (!localeName) {
			localeName = locale;
		}
		// If we are sure that parameter named "localeName" should contain name of target locale,
		// but it does not match rfc4647, we cannot continue.
		if (!isValidLocaleName(localeName)) {
			// in case you passed 3 parameters and second parameter is not valid locale name.
			throw "Invalid locale name.";
		}
		initNumberCurrencyFormat();
		initFormatterHelpers();

		var numberInfo = localeNumberCurrencyInfo.getNumberInfoByLocale(localeName);
		// If there is no pattern in the parameters, create a "default pattern" based on locale's data,
		// using group sizes.
		if (!pattern) {
			pattern = formatterHelpers.generateFormatPattern(numberInfo, (""+numberValue).length * 2);
		}
		return formatterHelpers.formatDecimal(numberValue, pattern, numberInfo);
	};

	return lang.setObject("Ti.Locale", Evented, {

		constants: {
			currentCountry: languageParts[1] || "",
			currentLanguage: languageParts[0] || "",
			currentLocale: locale
		},

		// Adds dashes to phone number. Result is unified with same function on Android 4.1.1
		formatTelephoneNumber: function(s) {
			initPhoneFormatter();
			return (phoneFormatter && phoneFormatter.formatTelephoneNumber)?phoneFormatter.formatTelephoneNumber(s, locale): s;
		},

		// Returns currency code that corresponds to locale. (locale:"en-US" => "USD")
		getCurrencyCode: function(locale) {
			initNumberCurrencyFormat();
			return localeNumberCurrencyInfo.getCurrencyInfoByLocale(locale).currencyCode;
		},

		// Returns currency symbol that corresponds to currency code. (currencyCode:"USD" => "$")
		getCurrencySymbol: function(currencyCode) {
			initNumberCurrencyFormat();
			return localeNumberCurrencyInfo.getCurrencyInfoByCode(currencyCode).currencySymbol;
		},

		// Returns currency symbol that corresponds to locale. (locale:"en-US" => "$")
		getLocaleCurrencySymbol: function(locale) {
			initNumberCurrencyFormat();
			return localeNumberCurrencyInfo.getCurrencyInfoByLocale(locale).currencySymbol;
		},

		getString: getString,

		_getString: function(key, hint) {
			return lang.val(hint, getString(key, hint));
		}

	});

});