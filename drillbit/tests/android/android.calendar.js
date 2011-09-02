describe("Ti.Android.Calendar tests", {
	
	moduleReachable: function() {
		//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2435-android-titaniumandroidcalendar-returns-null
		// Just tests if the module is even reachable, by referencing one of its constants
		valueOf( function() { Ti.Android.Calendar.METHOD_ALERT; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.METHOD_ALERT).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.METHOD_DEFAULT; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.METHOD_DEFAULT).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.METHOD_EMAIL; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.METHOD_EMAIL).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.METHOD_SMS; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.METHOD_SMS).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATE_DISMISSED; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATE_DISMISSED).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATE_FIRED; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATE_FIRED).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATE_SCHEDULED; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATE_SCHEDULED).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATUS_CANCELED; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATUS_CANCELED).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATUS_CONFIRMED; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATUS_CONFIRMED).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.STATUS_TENTATIVE; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.STATUS_TENTATIVE).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.VISIBILITY_CONFIDENTIAL; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.VISIBILITY_CONFIDENTIAL).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.VISIBILITY_DEFAULT; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.VISIBILITY_DEFAULT).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.VISIBILITY_PRIVATE; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.VISIBILITY_PRIVATE).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.VISIBILITY_PUBLIC; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.VISIBILITY_PUBLIC).shouldBeNumber();
		valueOf( function() { Ti.Android.Calendar.allAlerts; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.allAlerts).shouldBeObject();
		valueOf( function() { Ti.Android.Calendar.allCalendars; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.allCalendars).shouldBeObject();
		valueOf( function() { Ti.Android.Calendar. selectableCalendars; }).shouldNotThrowException();
		valueOf(Ti.Android.Calendar.selectableCalendars).shouldBeObject();		
	},
	
	options: {
		forceBuild: true
	}
});
