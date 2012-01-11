define("Ti/Locale", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		var lang = navigator.language.replace(/^([^\-\_]+)[\-\_](.+)?$/, function(o, l, c){ return l.toLowerCase() + (c && "-" + c.toUpperCase()); }),
			langParts = lang.split("-");
	
		// Properties
		Ti._5.propReadOnly(api, {
			currentCountry: langParts[1] || "",
			currentLanguage: langParts[0] || "",
			currentLocale: lang
		});
	
		// Methods
		api.formatTelephoneNumber = function() {
			console.debug('Method "Titanium.Locale.formatTelephoneNumber" is not implemented yet.');
		};
		api.getCurrencyCode = function() {
			console.debug('Method "Titanium.Locale.getCurrencyCode" is not implemented yet.');
		};
		api.getCurrencySymbol = function() {
			console.debug('Method "Titanium.Locale.getCurrencySymbol" is not implemented yet.');
		};
		api.getLocaleCurrencySymbol = function() {
			console.debug('Method "Titanium.Locale.getLocaleCurrencySymbol" is not implemented yet.');
		};
		api.getString = function(str, hintText) {
			var data = Ti._5.getLocaleData();
			if(typeof data[api.currentLanguage] != 'undefined' && typeof data[api.currentLanguage][str] != 'undefined') {
				return data[api.currentLanguage][str];
			} else if (typeof hintText != 'undefined'){
				return hintText;
			}
			return str;
		};
	})(Ti._5.createClass("Ti.Locale"));
	
	// L = Ti.Locale.getString;
	Object.defineProperty(window, "L", { value: Ti.Locale.getString, enumarable: true });
	
	(function(api){
		// format a generic string using the [IEEE printf specification](http://www.opengroup.org/onlinepubs/009695399/functions/printf.html).
		api.format = function(s) {
			console.debug('Method "String.format" is not implemented yet.');
			return [].concat(Array.prototype.slice.call(arguments, 0)).join(" ");
		};
	
		// format a date into a locale specific date format. Optionally pass a second argument (string) as either "short" (default), "medium" or "long" for controlling the date format.
		api.formatDate = function(dt, fmt) {
			console.debug('Method "String.formatDate" is not implemented yet.');
			return dt.toString();
		};
	
		// format a date into a locale specific time format.
		api.formatTime = function(dt) {
			console.debug('Method "String.formatTime" is not implemented yet.');
			return dt.toString();
		};
	
		// format a number into a locale specific currency format.
		api.formatCurrency = function(amt) {
			console.debug('Method "String.formatCurrency" is not implemented yet.');
			return amt;
		};
	
		// format a number into a locale specific decimal format.
		api.formatDecimal = function(dec) {
			console.debug('Method "String.formatDecimal" is not implemented yet.');
			return dec;
		};
	})(String);

});