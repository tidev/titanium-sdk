/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Utils', function () {
	it('exists', function () {
		should(Ti.Utils).not.be.undefined;
		should(Ti.Utils).be.an.Object;
	});

	it('apiName', function () {
		should(Ti.Utils).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Utils.apiName).be.eql('Ti.Utils');
	});

	it('#base64decode(String)', function () {
		var test;
		should(Ti.Utils.base64decode).be.a.Function;
		test = Ti.Utils.base64decode('dGVzdA==');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		should(test.getText()).be.eql('test');
	});

	it('#base64decode(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/encodedFile.txt'),
			blob = Ti.Utils.base64decode(f.read());
		should(blob.toString()).eql('Decoding successful!');
	});

	it('#base64encode(String)', function () {
		var test;
		should(Ti.Utils.base64encode).be.a.Function;
		test = Ti.Utils.base64encode('test');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		should(test.getText()).be.eql('dGVzdA==');
	});

	it('#base64encode(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.base64encode(contents).toString()).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	});

	// TODO According to docs, File is only accepted on Android. Should this be cross-platform?
	// For now, the only impl is Android, and there is no way to actually use the result without an error getting thrown
	// #toString() and #toBase64() (undocumented API) both end up throwing errors
	// Why can't this just be treated similarly to how passing in a Ti.Blob that's wrapping a file is
	it.skip('#base64encode(Ti.Filesystem.File)', function () { // it.androidBroken // this is broken, see above for why
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			blob = Ti.Utils.base64encode(f),
			string;

		// result here is a Ti.Blob
		should(blob).be.a.Object;
		should(blob.apiName).eql('Ti.Blob'); // toString() fails...
		string = blob.toBase64(); // undocumented API, still fails because calls getBytes() which calls getLength() which fails
		should(result).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	});

	it('#md5HexDigest(String)', function () {
		var test;
		should(Ti.Utils.md5HexDigest).be.a.Function;
		test = Ti.Utils.md5HexDigest('test');
		should(test).be.a.String;
		should(test).be.eql('098f6bcd4621d373cade4e832627b4f6');
	});

	it('#md5HexDigest(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/file.txt'),
			contents = f.read(),
			test;
		should(Ti.Utils.md5HexDigest).be.a.Function;
		test = Ti.Utils.md5HexDigest(contents);
		should(test).be.a.String;
		should(test).be.eql('4fe8a693c64f93f65c5faf42dc49ab23');
	});

	it('#sha1(String)', function () {
		var test;
		should(Ti.Utils.sha1).be.a.Function;
		test = Ti.Utils.sha1('test');
		should(test).be.a.String;
		should(test).be.eql('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
	});

	it('#sha1(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.sha1(contents).toString()).eql('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');
	});

	it('#sha256(String)', function () {
		var test;
		should(Ti.Utils.sha256).be.a.Function;
		test = Ti.Utils.sha256('test');
		should(test).be.a.String;
		should(test).be.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
	});

	it('#sha256(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.sha256(contents).toString()).eql('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');
	});

	// FIXME Android does no newlines for longer output, both iOS and Windows do. Need to get parity
	it.skip('TIMOB-9111', function () {
		var shortString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:1',
			longString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:12345678901234567890',
			tiBase64ShortResult = Ti.Utils.base64encode(shortString),
			tiBase64LongResult  = Ti.Utils.base64encode(longString);

		should(tiBase64ShortResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDox');
		should(tiBase64LongResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDoxMjM0NTY3ODkwMTIzNDU2Nzg5MA==');
	});
});
