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
	},
	
	//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2492-android-custom-js-activities-dont-correctly-pre-parse-the-url-attribute
	jsActivityUrl: asyncTest(function() {
		var intent = Ti.Android.createIntent({
			action: Ti.Android.ACTION_MAIN,
			url: 'jsActivity.js'
		});
		intent.addCategory(Ti.Android.CATEGORY_LAUNCHER);
		Ti.Android.currentActivity.startActivityForResult(intent, this.async(function(e) {
			Ti.API.debug(JSON.stringify(e));
			valueOf(e.resultCode).shouldBe(Ti.Android.RESULT_OK);
		}));
	}),
	
	options: {
		forceBuild: true
	}
});
