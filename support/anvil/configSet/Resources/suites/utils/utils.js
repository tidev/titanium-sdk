/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	};

	this.name = "utils";
	this.tests = [
		{name: "base64decode"},
		{name: "base64encode"},
		{name: "sha1"},
		{name: "sha256"},
		{name: "md5"}
	];

	if (Ti.Platform.osname === 'android') {
		this.tests = this.tests.concat([
			{name: "nullArrayTest"}
		]);
	}

	this.base64decode = function(testRun) {
		valueOf(testRun, Ti.Utils.base64decode).shouldBeFunction();
		valueOf(testRun, Ti.Utils.base64decode('SGVsbG8sIHdvcmxkIQ==')).shouldBe('Hello, world!');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/utils/encodedFile.txt');
		var contents = f.read();
		valueOf(testRun, Ti.Utils.base64decode(contents)).shouldBe('Decoding successful!');

		finish(testRun);
	};

	this.base64encode = function(testRun) {
		valueOf(testRun, Ti.Utils.base64encode).shouldBeFunction();
		valueOf(testRun, Ti.Utils.base64encode('Hello, world!')).shouldBe('SGVsbG8sIHdvcmxkIQ==');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/utils/decodedFile.txt');
		var contents = f.read();
		valueOf(testRun, Ti.Utils.base64encode(contents)).shouldBe('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');

		finish(testRun);
	};

    this.sha1 = function(testRun) {
		valueOf(testRun, Ti.Utils.sha1).shouldBeFunction();
        valueOf(testRun, Ti.Utils.sha1("The quick brown fox jumps over the lazy dog.")).shouldBe('408d94384216f890ff7a0c3528e8bed1e0b01621');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/utils/decodedFile.txt');
		var contents = f.read();
		valueOf(testRun, Ti.Utils.sha1(contents)).shouldBe('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');

		finish(testRun);
    };

    this.sha256 = function(testRun) {
		valueOf(testRun, Ti.Utils.sha256).shouldBeFunction();
        valueOf(testRun, Ti.Utils.sha256("The quick brown fox jumps over the lazy dog.")).shouldBe('ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/utils/decodedFile.txt');
		var contents = f.read();
		valueOf(testRun, Ti.Utils.sha256(contents)).shouldBe('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');

		finish(testRun);
    };

    this.md5 = function(testRun) {
		valueOf(testRun, Ti.Utils.md5HexDigest).shouldBeFunction();
        valueOf(testRun, Ti.Utils.md5HexDigest("Hello, world!")).shouldBe('6cd3556deb0da54bca060b4c39479839');

		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'suites/utils/decodedFile.txt');
		var contents = f.read();
		valueOf(testRun, Ti.Utils.md5HexDigest(contents)).shouldBe('86bd3c0247976528f3b7559d38cfb405');
		
		finish(testRun);
    };

	this.nullArrayTest = function(testRun) {
		valueOf(testRun, Ti.Utils.arrayTest(null,null,null,null)).shouldBeTrue();
		valueOf(testRun, Ti.Utils.arrayTest([],[],[],[])).shouldBeTrue();

		finish(testRun);
    };
};
