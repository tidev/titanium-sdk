describe("Android resources tests", {
	
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3163
	packagedResources: function() {
		Ti.Facebook.appid=1;//forces inclusion of facebook module.
		valueOf( function() {
			var resid=Ti.App.Android.R.drawable.facebook_login;
			valueOf(resid).shouldBeGreaterThan(0);
		}).shouldNotThrowException();
	}

});
