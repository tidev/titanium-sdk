describe("Ti.Platform Android tests", {
	
	localeString: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2333
		var locale = Ti.Platform.locale;
		valueOf(locale.length >= 4).shouldBe(true);
		valueOf(locale.charAt(2)).shouldBe("-");
	}
});
