describe("Titanium module tests", {
	// http://jira.appcelerator.org/browse/TIMOB-4628
	buildHash: function() {
		valueOf(Titanium.buildHash.length).shouldBe(7);
	}
});
