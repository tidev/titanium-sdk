describe("Ti.Filesystem tests", {
	
	optionalArgAPIs: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2211-android-filesystem-test-generates-runtime-error
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		newDir.createDirectory();
		valueOf(newDir.exists()).shouldBeTrue();
		newDir.deleteDirectory();
		valueOf(newDir.exists()).shouldBeFalse();
	}
});
