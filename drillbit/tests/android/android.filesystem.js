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
		
		var newDirectory = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'newDir');
		newDirectory.createDirectory();
		
		var newFile = Ti.Filesystem.getFile(newDirectory.getNativePath(),'this-file-exists.js');
		newFile.write("testing a file");

		var appDataFileDoesExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-exists.js');
		var appDataFileDoesNotExist = Ti.Filesystem.getFile(newDirectory.getNativePath(), 'this-file-does-not-exist.js');
		
		valueOf(newDirectory.isDirectory()).shouldBeTrue();
		valueOf(newDirectory.exists()).shouldBeTrue();
		valueOf(appDataFileDoesExist.exists()).shouldBeTrue();
		valueOf(appDataFileDoesNotExist.exists()).shouldBeFalse();

	}
});
