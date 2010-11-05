describe("test tiapp.xml against API", {
	test_custom_values: function() {
		valueOf(Ti.App.id).shouldBe('org.appcelerator.titanium.testharness');
		valueOf(Ti.App.name).shouldBe('test_harness');
		valueOf(Ti.App.version).shouldBe("1.0.1");
		valueOf(Ti.App.publisher).shouldBe("test publisher");
		valueOf(Ti.App.url).shouldBe("http://www.test.com");
		valueOf(Ti.App.description).shouldBe('test description');
		valueOf(Ti.App.copyright).shouldBe('copyright 2010 test');
	}
});