describe("An Android specific testsuite",
{
	android_apis: function() {
		valueOf(Ti.UI.Android).shouldNotBeNull();
		valueOf(Ti.Android).shouldNotBeNull();
	}
});
