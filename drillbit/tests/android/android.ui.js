describe("Ti.UI.Android tests", {
	androidUIAPIs: function() {
		valueOf(Ti.UI.Android).shouldNotBeNull();
	}, 
	testModuleNameCollision: function() {
		// Make sure both Ti.UI.Android and Ti.Android are properly accessible.
		// cf https://appcelerator.lighthouseapp.com/projects/32238/tickets/2000
		valueOf(Ti.UI.Android.SOFT_INPUT_ADJUST_PAN).shouldBe(32);
		valueOf(Ti.Android.ACTION_ALL_APPS).shouldBe('android.intent.action.ALL_APPS');
	}
})
