describe("JSS tests", {
	// See http://jira.appcelerator.org/browse/TIMOB-4447
	platform_jss_dirs: function() {
		var test = Ti.UI.createView({ id: "test" });
		valueOf(test).shouldNotBeNull();

		if (Ti.Platform.name == "android") {
			valueOf(test.backgroundColor).shouldBe("red");
		} else {
			valueOf(test.backgroundColor).shouldBe("blue");
		}
	}
});
