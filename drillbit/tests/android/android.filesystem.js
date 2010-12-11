describe("Android Ti.Filesystem tests", {
	externalStorageAPI: function() {
		valueOf(Ti.Filesystem.isExternalStoragePresent).shouldBeFunction();
		valueOf(Ti.Filesystem.externalStoragePresent).shouldBeBoolean();
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1778
	// blob.nativeFile not supported yet in iOS.  See #2553.  I told them once they're ready they can move this test into filesystem (shared test).
	blobNativeFile: function() {
		var filename = 'blobtest';
		var testphrase = 'Revenge of the Blob';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);

		if (file.exists()) {
			file.deleteFile();
		}
		file.write(testphrase);
		var blob = file.read();
		file = null;
		var path = blob.nativePath;
		file = Ti.Filesystem.getFile(path);
		valueOf(file.exists()).shouldBeTrue();
		var readphrase = file.read().text;
		valueOf(readphrase).shouldBe(testphrase);
	}
});
