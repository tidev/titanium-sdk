/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("utils", function() {
	it("base64decode", function(finish) {
		should(Ti.Utils.base64decode).be.a.Function;
		var blob = Ti.Utils.base64decode("SGVsbG8sIHdvcmxkIQ==");
		should(blob.toString()).eql("Hello, world!");
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/encodedFile.txt");
		blob = Ti.Utils.base64decode(f.read());
		should(blob.toString()).eql("Decoding successful!");
		finish();
	});

	it("base64encode", function(finish) {
		should(Ti.Utils.base64encode).be.a.Function;
		should(Ti.Utils.base64encode("Hello, world!").toString()).eql("SGVsbG8sIHdvcmxkIQ==");
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/decodedFile.txt");
		var contents = f.read();
		should(Ti.Utils.base64encode(contents).toString()).eql("SSBhbSBub3QgZW5jb2RlZCB5ZXQu");
		finish();
	});

	it("sha1", function(finish) {
		should(Ti.Utils.sha1).be.a.Function;
		should(Ti.Utils.sha1("The quick brown fox jumps over the lazy dog.").toString()).eql("408d94384216f890ff7a0c3528e8bed1e0b01621");
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/decodedFile.txt");
		var contents = f.read();
		should(Ti.Utils.sha1(contents).toString()).eql("ddbb50fb5beea93d1d4913fc22355c84f22d43ed");
		finish();
	});

	it("sha256", function(finish) {
		should(Ti.Utils.sha256).be.a.Function;
		should(Ti.Utils.sha256("The quick brown fox jumps over the lazy dog.").toString()).eql("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c");
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/decodedFile.txt");
		var contents = f.read();
		should(Ti.Utils.sha256(contents).toString()).eql("9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3");
		finish();
	});

	it("md5", function(finish) {
		should(Ti.Utils.md5HexDigest).be.a.Function;
		should(Ti.Utils.md5HexDigest("Hello, world!").toString()).eql("6cd3556deb0da54bca060b4c39479839");
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "txtFiles/decodedFile.txt");
		var contents = f.read();
		should(Ti.Utils.md5HexDigest(contents).toString()).eql("86bd3c0247976528f3b7559d38cfb405");
		finish();
	});

	("android" === Ti.Platform.osname ? it : it.skip)("nullArrayTest", function(finish) {
		should(Ti.Utils.arrayTest(null, null, null, null)).be.true;
		should(Ti.Utils.arrayTest([], [], [], [])).be.true;
		finish();
	});
});