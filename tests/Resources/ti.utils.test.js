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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

// handy tool: https://www.fileformat.info/tool/hash.htm

describe('Titanium.Utils', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

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
		// Basic tests
		should(Ti.Utils.base64decode).be.a.Function;
		test = Ti.Utils.base64decode('dGVzdA==');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		should(test.getText()).be.eql('test');

		// Test string without padding
		should(!Ti.Utils.base64decode('eyJzdWIiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0IiwiYXVkIjoidGVzdCIsImp0aSI6ImxvTHM4d2o5aWxBQUtWckNxbzhaMFMiLCJpc3MiOiJodHRwczpcL1wvc3NvLmV4YW1wbGUuY29tIiwiaWF0IjoxNTI2MTY3NDc3LCJleHAiOjE1MjYxNjc0NzcsInBpLnRlc3QiOiJMSTRmMW81Q2pqU2tHU2xTanM0bHlPeVlROCJ9')).not.be.null;

		// More padding tests
		should(Ti.Utils.base64decode('Zg').text).eql('f');
		should(Ti.Utils.base64decode('Zm8').text).eql('fo');
		should(Ti.Utils.base64decode('Zm9v').text).eql('foo');
		should(Ti.Utils.base64decode('Zm9vYg').text).eql('foob');
		should(Ti.Utils.base64decode('Zm9vYmE').text).eql('fooba');
		should(Ti.Utils.base64decode('Zm9vYmFy').text).eql('foobar');
	});

	// FIXME Windows gives: 'base64decode: attempt to decode a value not in base64 char set'
	it.windowsBroken('#base64decode(Ti.Blob with text data)', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/encodedFile.txt'),
			blob = Ti.Utils.base64decode(f.read());
		should(blob.text).eql('Decoding successful!');
	});

	it('#base64encode(String)', function () {
		var test;
		should(Ti.Utils.base64encode).be.a.Function;
		test = Ti.Utils.base64encode('test');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		should(test.getText()).be.eql('dGVzdA==');
	});

	it('#base64encode(Ti.Blob#TYPE_FILE)', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			contents = f.read();
		should(Ti.Utils.base64encode(contents).text).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	});

	it('#base64encode(Ti.Blob#TYPE_DATA from Ti.UI.View.toImage() async)', function (finish) {
		var label;

		this.timeout(5000);

		win = Ti.UI.createWindow();
		label = Ti.UI.createLabel({ text: 'test' });
		win.add(label);
		win.addEventListener('focus', function () {
			// Get a Ti.Blob from view.toImage()
			label.toImage(function (blob) {
				var result;
				try {
					if (utilities.isAndroid()) {
						should(blob.type).eql(2); // Android-specific property, value of 2 indicates TYPE_DATA
					}
					result = Ti.Utils.base64encode(blob);
					// result here is a Ti.Blob
					should(result).be.a.Object; // Fails here
					should(result.apiName).eql('Ti.Blob');
					// should(blob.text).eql('aGVsbG8gd29ybGQ='); // FIXME What sanity check can we do here?
					finish();
				} catch (err) {
					finish(err);
				}
			});
		});
		win.open();
	});

	it('#base64encode(Ti.Blob#TYPE_DATA from Ti.Buffer.toBlob())', function () {
		var blob,
			buffer = Ti.createBuffer({ value: 'hello world' }); // Easiest way to get a TYPE_DATA Blob is from Ti.Buffer.toBlob()
		blob = Ti.Utils.base64encode(buffer.toBlob());
		// result here is a Ti.Blob
		should(blob).be.a.Object;
		should(blob.apiName).eql('Ti.Blob');
		should(blob.text).eql('aGVsbG8gd29ybGQ=');
	});

	it('#base64encode(Ti.Blob#TYPE_STRING)', function () {
		// Only way to get a blob of type string is the result of base64encode(String) on Android!
		var blob,
			test = Ti.Utils.base64encode('test');
		should(test).be.a.Object;
		should(test.apiName).eql('Ti.Blob');
		if (utilities.isAndroid()) {
			should(test.type).eql(3); // Android-specific property, value of 3 indicates TYPE_STRING
		}
		should(test.getText()).be.eql('dGVzdA==');

		blob = Ti.Utils.base64encode(test);
		// result here is a Ti.Blob
		should(blob).be.a.Object;
		should(blob.apiName).eql('Ti.Blob');
		should(blob.text).eql('ZEdWemRBPT0=');
	});

	// FIXME: base64encode accepts Ti.File as a parameter on iOS/Android, but not on Windows.
	it.windowsBroken('#base64encode(Ti.Filesystem.File)', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt');
		var blob = Ti.Utils.base64encode(f);

		// result here is a Ti.Blob
		should(blob).be.a.Object;
		should(blob.apiName).eql('Ti.Blob');
		should(blob.text).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
	});

	// FIXME: base64decode accepts Ti.File as a parameter on iOS/Android, but not on Windows.
	it.windowsBroken('#base64decode(Ti.Filesystem.File with text data)', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/encodedFile.txt');
		var blob = Ti.Utils.base64decode(f);

		// result here is a Ti.Blob
		should(blob).be.a.Object;
		should(blob.apiName).eql('Ti.Blob');
		should(blob.text).eql('Decoding successful!');
	});

	// FIXME: How can I make this valid? The input needs to be valid base64...
	// An image can't be right. Maybe we can validate in UtilsModule that a given blob is non-binary?
	// it.windowsBroken('#base64decode(Ti.Filesystem.File with binary data)', function () {
	// 	var binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png'),
	// 		blob = Ti.Utils.base64decode(binaryFile);
	//
	// 	// result here is a Ti.Blob
	// 	should(blob).be.a.Object;
	// 	should(blob.apiName).eql('Ti.Blob');
	// 	// ignore the actual decoded value...
	// });

	it('#md5HexDigest(String)', function () {
		var test;
		should(Ti.Utils.md5HexDigest).be.a.Function;
		test = Ti.Utils.md5HexDigest('test');
		should(test).be.a.String;
		should(test).be.eql('098f6bcd4621d373cade4e832627b4f6');
	});

	it('#md5HexDigest(Ti.Blob with text data)', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/file.txt'),
			contents = f.read(),
			test;
		should(Ti.Utils.md5HexDigest).be.a.Function;
		test = Ti.Utils.md5HexDigest(contents);
		should(test).be.a.String;
		should(test).be.eql('4fe8a693c64f93f65c5faf42dc49ab23'); // Windows Desktop gives: 'ab1600f840b927f80a3dc000c510d1d3'
	});

	it.windowsBroken('#md5HexDigest(Ti.Blob with binary data)', function () {
		var binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png'),
			blob = binaryFile.read(),
			result;
		should(Ti.Utils.md5HexDigest).be.a.Function;
		result = Ti.Utils.md5HexDigest(blob);
		should(result).be.a.String;
		should(result).be.eql('803fd0b8dd9a3ca5238390732db54062');
	});

	it('#sha1(String)', function () {
		var test;
		should(Ti.Utils.sha1).be.a.Function;
		test = Ti.Utils.sha1('test');
		should(test).be.a.String;
		should(test).be.eql('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
	});

	it('#sha1(Ti.Blob with text data)', function () {
		var textFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			blob = textFile.read();
		should(Ti.Utils.sha1(blob)).eql('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');
	});

	it('#sha1(Ti.Blob with binary data)', function () {
		var binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png'),
			blob = binaryFile.read();
		should(Ti.Utils.sha1(blob)).eql('668e98c66d8a11ef38ab442d9d6d4a21d8593645');
	});

	it('#sha256(String)', function () {
		var test;
		should(Ti.Utils.sha256).be.a.Function;
		test = Ti.Utils.sha256('test');
		should(test).be.a.String;
		should(test).be.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
	});

	it('#sha256(Ti.Blob with text data)', function () {
		var textFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt'),
			blob = textFile.read();
		should(Ti.Utils.sha256(blob)).eql('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');
	});

	it('#sha256(Ti.Blob with binary data)', function () {
		var binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png'),
			blob = binaryFile.read();
		should(Ti.Utils.sha256(blob)).eql('54be80ae48e4242d56170248e730ffac60a2828d07260a048e2ac0fd62386234');
	});

	// FIXME Android and iOS do no newlines for longer output, Windows does. Need to get parity
	it.windowsBroken('TIMOB-25513', function () {
		var shortString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:1',
			longString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:12345678901234567890',
			tiBase64ShortResult = Ti.Utils.base64encode(shortString),
			tiBase64LongResult  = Ti.Utils.base64encode(longString);

		should(tiBase64ShortResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDox');
		should(tiBase64LongResult.getText()).be.eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDoxMjM0NTY3ODkwMTIzNDU2Nzg5MA==');
	});
});
