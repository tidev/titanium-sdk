describe("Titanium module tests", {
	// http://jira.appcelerator.org/browse/TIMOB-4628
	buildHash: function() {
		valueOf(Titanium.buildHash.length).shouldBe(7);
	},
	userAgent: function() {
		valueOf(Titanium.userAgent).shouldBeString();
		valueOf(Titanium.userAgent.indexOf("Titanium")).shouldBeNumber();
	}
});
