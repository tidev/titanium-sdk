/*global describe, Ti, valueOf */
describe("Ti.Filesystem tests", {
	
	optionalArgAPIs: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2211-android-filesystem-test-generates-runtime-error
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		newDir.createDirectory();
		valueOf(newDir.exists()).shouldBeTrue();
		newDir.deleteDirectory();
		valueOf(newDir.exists()).shouldBeFalse();
	},
	readWriteText: function() {
		var TEXT = "This is my text";
		var FILENAME = 'test.txt';
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		if (file.exists()) {
			file.deleteFile();
		}
		file.write(TEXT);
		// nullify and re-create to test
		file = null;
		file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, FILENAME);
		valueOf(file.exists()).shouldBeTrue();
		var blob = file.read();
		valueOf(blob).shouldNotBeNull();
		var readText = blob.text;
		valueOf(readText).shouldNotBeNull();
		valueOf(readText).shouldNotBeUndefined();
		valueOf(readText).shouldBeString();
		valueOf(readText.length).shouldBe(TEXT.length);
		valueOf(readText).shouldBe(TEXT);
		file.deleteFile();
	}

});
