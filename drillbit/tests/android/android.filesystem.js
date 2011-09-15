describe("Android Ti.Filesystem tests", {
	externalStorageAPI: function() {
		valueOf(Ti.Filesystem.isExternalStoragePresent).shouldBeFunction();
		valueOf(Ti.Filesystem.externalStoragePresent).shouldBeBoolean();
	},
	// http://jira.appcelerator.org/browse/TIMOB-4469
	filesInResourceDirectoryExists: function() {
		var resourcesFileDoesExist = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		var resourcesFileDoesNotExist = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'this-file-does-not-exist.js');

		valueOf(resourcesFileDoesExist.exists()).shouldBeTrue();
		valueOf(resourcesFileDoesNotExist.exists()).shouldBeFalse();
	},
	filesInApplicationDataDirectoryExists: function() {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'this-file-exists.js');
		newFile.write("testing a file");

		var appDataFileDoesExist = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'this-file-exists.js');
		var appDataFileDoesNotExist = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'this-file-does-not-exist.js');
    
		valueOf(appDataFileDoesExist.exists()).shouldBeTrue();
		valueOf(appDataFileDoesNotExist.exists()).shouldBeFalse();
	}
});
