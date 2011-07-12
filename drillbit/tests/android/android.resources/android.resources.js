describe("Android resources tests", {
	
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3163
	packagedResources: function() {
		Ti.Facebook.appid=1;//forces inclusion of facebook module.
		valueOf( function() {
			var resid=Ti.App.Android.R.drawable.facebook_login;
			valueOf(resid).shouldBeGreaterThan(0);
		}).shouldNotThrowException();
	},
	// http://jira.appcelerator.org/browse/TIMOB-4027
	failedResourceLookup:function() {
		// checking non-existent resource should not raise exception
		// (It was raising exception second time).
		valueOf(function(){var x = L('mickey');}).shouldNotThrowException();
		valueOf(function(){var x = L('mickey');}).shouldNotThrowException();
	}
});
