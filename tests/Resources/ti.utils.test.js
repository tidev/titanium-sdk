/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Utils', function () {
	it('Ti.Utils', function () {
		should(Ti.Utils).not.be.undefined;
		should(Ti.Utils).be.an.Object;
	});

	it('#apiName', function () {
		should(Ti.Utils).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Utils.apiName).be.eql('Ti.Utils');
	});

	it('#base64decode(String)', function () {
		should(Ti.Utils.base64decode).be.a.Function;
		var test = Ti.Utils.base64decode('dGVzdA==');
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
		should(Ti.Utils.base64encode).be.a.Function;
		var test = Ti.Utils.base64encode('test');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		should(test.getText()).be.eql('dGVzdA==');
	});

	it('#base64encode(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.base64encode(contents).toString()).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	});

	it('md5HexDigest()', function () {
		should(Ti.Utils.md5HexDigest).be.a.Function;
		var test = Ti.Utils.md5HexDigest('test');
		should(test).be.a.String;
		should(test).be.eql('098f6bcd4621d373cade4e832627b4f6');
	});

	it('#sha1(String)', function () {
		should(Ti.Utils.sha1).be.a.Function;
		var test = Ti.Utils.sha1('test');
		should(test).be.a.String;
		should(test).be.eql('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
	});

	it('#sha1(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.sha1(contents).toString()).eql('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');
	});

	it('#sha256(String)', function () {
		should(Ti.Utils.sha256).be.a.Function;
		var test = Ti.Utils.sha256('test');
		should(test).be.a.String;
		should(test).be.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
	});

	it('#sha256(Ti.Blob)', function () {
		var f = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.sha256(contents).toString()).eql('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');
	});

	// TODO Test base64encode() should also take Ti.Filesystem.File!

	// FIXME Android does no newlines for longer output, both iOS and Windows do. Need to get parity
	it.skip('TIMOB-9111', function () {
		var shortString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:1',
			longString  = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:12345678901234567890',
			tiBase64ShortResult = Ti.Utils.base64encode(shortString),
			tiBase64LongResult  = Ti.Utils.base64encode(longString);

		should(tiBase64ShortResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDox');
		should(tiBase64LongResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDoxMjM0NTY3ODkwMTIzNDU2Nzg5MA==');
	});
});
