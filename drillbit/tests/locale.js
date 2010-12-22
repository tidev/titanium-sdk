describe("Ti.Locale tests", {
	localePPEnhancements: function() {
		valueOf(Ti.Locale.getCurrentLanguage()).shouldBe('en');
		valueOf(Ti.Locale.getCurrentCountry().search(/^[A-Z]{2}$/)).shouldBeGreaterThanEqual(0);
		var x = Ti.Locale.getCurrentLocale();
		valueOf(x.search(/^[a-z]{2}$/)>=0 || x.search(/^[a-z]{2}\-[A-Z]{2}$/)>=0).shouldBeTrue();
		valueOf(Ti.Locale.getCurrencyCode('en-US')).shouldBe('USD');
		valueOf(Ti.Locale.getCurrencySymbol('USD')).shouldBe('$');
		valueOf(Ti.Locale.getLocaleCurrencySymbol('en-US')).shouldBe('$');
	},
	stringPPEnhancements: function() {
		valueOf(String.formatDecimal(2.5)).shouldBe('2.5');
		valueOf(String.formatDecimal(2.5, '000.000')).shouldBe('002.500');
		valueOf(String.formatDecimal(2.5, 'de-DE')).shouldBe('2,5');
		valueOf(String.formatDecimal(2.5, 'de-DE', '000.0000')).shouldBe('002,5000');
	}
});
