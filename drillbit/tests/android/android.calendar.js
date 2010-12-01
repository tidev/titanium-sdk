describe("Ti.Android.Calendar tests", {
	
	moduleReachable: function() {
		//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2435-android-titaniumandroidcalendar-returns-null
		// Just tests if the module is even reachable, by referencing one of its constants
		valueOf( function() { Ti.Android.Calendar.METHOD_EMAIL; }).shouldNotThrowException();
	},
	
	options: {
		forceBuild: true
	}
});
