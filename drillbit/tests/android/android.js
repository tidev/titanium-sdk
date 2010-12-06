describe("Ti.Android tests", {
	androidAPIs: function() {
		valueOf(Ti.Android).shouldNotBeNull();
		valueOf(Ti.Android.currentActivity).shouldNotBeNull();
	},
	
	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/1592-android-move-menu-to-tiandroidactivity
	androidMenu: function() {
		var activity = Ti.Android.currentActivity;
		
		valueOf(activity.onCreateOptionsMenu).shouldBeUndefined();
		activity.onCreateOptionsMenu = function(e) {};
		valueOf(activity.onCreateOptionsMenu).shouldBeFunction();
		
		valueOf(activity.onPrepareOptionsMenu).shouldBeUndefined();
		activity.onPrepareOptionsMenu = function(e) {};
		valueOf(activity.onPrepareOptionsMenu).shouldBeFunction();
	}
});
