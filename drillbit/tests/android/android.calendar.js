describe("Ti.Android.Calendar tests", {
	
	moduleReachable: function() {
		//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2435-android-titaniumandroidcalendar-returns-null
		// Just tests if the module is even reachable, by referencing one of its constants
		valueOf( function() { Ti.Android.Calendar.METHOD_ALERT; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.METHOD_ALERT).shouldBeNumber();
		valueOf(Ti.Android.Calendar.METHOD_DEFAULT).shouldBeNumber();
		valueOf(Ti.Android.Calendar.METHOD_EMAIL).shouldBeNumber();
		valueOf(Ti.Android.Calendar.METHOD_SMS).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATE_DISMISSED).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATE_FIRED).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATE_SCHEDULED).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATUS_CANCELED).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATUS_CONFIRMED).shouldBeNumber();
		valueOf(Ti.Android.Calendar.STATUS_TENTATIVE).shouldBeNumber();
		valueOf(Ti.Android.Calendar.VISIBILITY_CONFIDENTIAL).shouldBeNumber();
		valueOf(Ti.Android.Calendar.VISIBILITY_DEFAULT).shouldBeNumber();
		valueOf(Ti.Android.Calendar.VISIBILITY_PRIVATE).shouldBeNumber();
		valueOf(Ti.Android.Calendar.VISIBILITY_PUBLIC).shouldBeNumber();
		valueOf(Ti.Android.Calendar.allAlerts).shouldBeArray();
		valueOf(Ti.Android.Calendar.allCalendars).shouldBeArray();
		valueOf(Ti.Android.Calendar.selectableCalendars).shouldBeArray();		
	},
	
	options: {
		forceBuild: true
	}
});
