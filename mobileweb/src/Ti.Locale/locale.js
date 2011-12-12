(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	var lang = navigator.language.split("-");

	// Properties
	Ti._5.propReadOnly(api, {
		currentCountry: "",
		currentLanguage: lang[0],
		currentLocale: ""
	});

	// Methods
	api.formatTelephoneNumber = function(){
		console.debug('Method "Titanium.Locale.formatTelephoneNumber" is not implemented yet.');
	};
	api.getCurrencyCode = function(){
		console.debug('Method "Titanium.Locale.getCurrencyCode" is not implemented yet.');
	};
	api.getCurrencySymbol = function(){
		console.debug('Method "Titanium.Locale.getCurrencySymbol" is not implemented yet.');
	};
	api.getLocaleCurrencySymbol = function(){
		console.debug('Method "Titanium.Locale.getLocaleCurrencySymbol" is not implemented yet.');
	};
	api.getString = function(str, hintText){
		var data = Ti._5.getLocaleData();
		if(typeof data[api.currentLanguage] != 'undefined' && typeof data[api.currentLanguage][str] != 'undefined') {
			return data[api.currentLanguage][str];
		} else if (typeof hintText != 'undefined'){
			return hintText;
		}
		return str;
	};
})(Ti._5.createClass('Ti.Locale'));

L = Ti.Locale.getString; // QUESTION: should this really be in the global namespace?

(function(api){
	api.format = function(){
		console.debug('Method "String.format" is not implemented yet.');
	};

	api.formatDate = function(){
		console.debug('Method "String.formatDate" is not implemented yet.');
	};

	api.formatTime = function(){
		console.debug('Method "String.formatTime" is not implemented yet.');
	};

	api.formatCurrency = function(){
		console.debug('Method "String.formatCurrency" is not implemented yet.');
	};

	api.formatDecimal = function(){
		console.debug('Method "String.formatDecimal" is not implemented yet.');
	};
})(String);
