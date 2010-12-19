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
	},
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
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2443-android-paths-beginning-with-are-not-recognised#ticket-2443-6
	dotSlash: function() {
		var f;
		var blob;
		valueOf(function(){f = Ti.Filesystem.getFile('./file.txt');}).shouldNotThrowException();
		valueOf(function(){blob = f.read();}).shouldNotThrowException();
		var text;
		valueOf(function(){text = blob.text;}).shouldNotThrowException();
		valueOf(text.length).shouldBeGreaterThan(0);
	}
});
