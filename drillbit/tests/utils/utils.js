/*global Titanium, Ti, describe, valueOf */
/* One unknown about encoding/hashing blobs is whether or not the file's terminating return key*/
/*counts in the read blob. Since we're testing the alogarythms in this unit, and not the reading,*/
/*decodedFile.txt does not have a terminating return to moot this issue.*/

describe("Ti.Utils tests", {
	base64decode: function() {
		valueOf(Ti.Utils.base64decode).shouldBeFunction();
		valueOf(Ti.Utils.base64decode(null)).shouldBeNull();
		valueOf(Ti.Utils.base64decode('SGVsbG8sIHdvcmxkIQ==')).shouldBe('Hello, world!');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'encodedFile.txt');
		var contents = f.read();
		valueOf(Ti.Utils.base64decode(contents)).shouldBe('Decoding successful!');
	},
	base64encode: function() {
		valueOf(Ti.Utils.base64encode).shouldBeFunction();
		valueOf(Ti.Utils.base64encode(null)).shouldBeNull();
		valueOf(Ti.Utils.base64encode('Hello, world!')).shouldBe('SGVsbG8sIHdvcmxkIQ==');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'decodedFile.txt');
		var contents = f.read();
		valueOf(Ti.Utils.base64encode(contents)).shouldBe('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	}/*,
    sha1: function() {
		valueOf(Ti.Utils.sha1).shouldBeFunction();
        valueOf(Ti.Utils.sha1("The quick brown fox jumps over the lazy dog.")).shouldBe('408d94384216f890ff7a0c3528e8bed1e0b01621');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'decodedFile.txt');
		var contents = f.read();
		valueOf(Ti.Utils.sha1(contents)).shouldBe('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');
    },
    sha256: function() {
		valueOf(Ti.Utils.sha256).shouldBeFunction();
        valueOf(Ti.Utils.sha256("The quick brown fox jumps over the lazy dog.")).shouldBe('ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'decodedFile.txt');
		var contents = f.read();
		valueOf(Ti.Utils.sha256(contents)).shouldBe('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');
    },
    md5: function() {
		valueOf(Ti.Utils.md5HexDigest).shouldBeFunction();
        valueOf(Ti.Utils.md5HexDigest("Hello, world!")).shouldBe('6cd3556deb0da54bca060b4c39479839');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'decodedFile.txt');
		var contents = f.read();
		valueOf(Ti.Utils.md5HexDigest(contents)).shouldBe('86bd3c0247976528f3b7559d38cfb405');
    }*/

});
