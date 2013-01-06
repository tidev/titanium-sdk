define(["require", "Ti/_/lang", "Ti/_/Evented", "Ti/API"],
	function(require, lang, Evented, API) {

	var locale = lang.val(navigator.language,navigator.browserLanguage).replace(/^([^\-\_]+)[\-\_](.+)?$/, function(o, l, c){ return l.toLowerCase() + (c && "-" + c.toUpperCase()); }),
		languageParts = locale.split("-"),
		language = languageParts[0],
		strings = {},
		cfg = require.config,
		app = cfg.app;

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

	// format a date into a locale specific date format. Optionally pass a second argument (string) as either "short" (default), "medium" or "long" for controlling the date format.
	String.formatDate = function(dt, fmt) {
		API.debug('Method "String.formatDate" is not implemented yet.');
		return dt.toString();
	};

	// format a date into a locale specific time format.
	String.formatTime = function(dt) {
		API.debug('Method "String.formatTime" is not implemented yet.');
		return dt.toString();
	};

	// format a number into a locale specific currency format.
	String.formatCurrency = function(amt) {
		API.debug('Method "String.formatCurrency" is not implemented yet.');
		return amt;
	};

	// format a number into a locale specific decimal format.
	String.formatDecimal = function(dec) {
		API.debug('Method "String.formatDecimal" is not implemented yet.');
		return dec;
	};

	return lang.setObject("Ti.Locale", Evented, {

		constants: {
			currentCountry: languageParts[1] || "",
			currentLanguage: languageParts[0] || "",
			currentLocale: locale
		},

		formatTelephoneNumber: function(s) {
			return s;
		},

		getCurrencyCode: function(locale) {
			// locale = "en-US" => "USD"
			return "";
		},

		getCurrencySymbol: function(currencyCode) {
			// currencyCode = "en-US" => "$"
			return "";
		},

		getLocaleCurrencySymbol: function(locale) {
			// locale = "en-US" => "$"
			return "";
		},

		getString: getString,

		_getString: function(key, hint) {
			return lang.val(hint, getString(key, hint));
		}

	});

});