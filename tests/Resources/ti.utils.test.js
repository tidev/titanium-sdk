/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_ANDROID */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

// handy tool: https://www.fileformat.info/tool/hash.htm

describe('Titanium.Utils', function () {
	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('exists', () => {
		should(Ti.Utils).not.be.undefined();
		should(Ti.Utils).be.an.Object();
	});

	it('apiName', () => {
		should(Ti.Utils).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Utils.apiName).be.eql('Ti.Utils');
	});

	describe('#base64encode()', () => {
		it('is a Function', () => {
			should(Ti.Utils.base64encode).be.a.Function();
		});

		it('String', () => {
			const test = Ti.Utils.base64encode('test');
			should(test).be.a.Object();
			should(test.apiName).eql('Ti.Blob');
			should(test.text).eql('dGVzdA==');
		});

		it('Ti.Blob#TYPE_FILE', () => {
			const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt');
			const contents = f.read();
			should(Ti.Utils.base64encode(contents).text).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
		});

		it('Ti.Blob#TYPE_DATA from Ti.UI.View.toImage() async', function (finish) {
			this.timeout(5000);

			win = Ti.UI.createWindow();
			const label = Ti.UI.createLabel({ text: 'test' });
			win.add(label);
			win.addEventListener('focus', function focusListener() {
				win.removeEventListener('focus', focusListener);
				// Get a Ti.Blob from view.toImage()
				label.toImage(function (blob) {
					try {
						if (OS_ANDROID) {
							should(blob.type).eql(2); // Android-specific property, value of 2 indicates TYPE_DATA
						}
						const result = Ti.Utils.base64encode(blob);
						// result here is a Ti.Blob
						should(result).be.an.Object();
						should(result.apiName).eql('Ti.Blob');
						// should(blob.text).eql('aGVsbG8gd29ybGQ='); // FIXME What sanity check can we do here?
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			});
			win.open();
		});

		it('Ti.Blob#TYPE_DATA from Ti.Buffer.toBlob()', () => {
			const buffer = Ti.createBuffer({ value: 'hello world' }); // Easiest way to get a TYPE_DATA Blob is from Ti.Buffer.toBlob()
			const blob = Ti.Utils.base64encode(buffer.toBlob());
			// result here is a Ti.Blob
			should(blob).be.an.Object();
			should(blob.apiName).eql('Ti.Blob');
			should(blob.text).eql('aGVsbG8gd29ybGQ=');
		});

		it('Ti.Blob#TYPE_STRING', () => {
			// Only way to get a blob of type string is the result of base64encode(String) on Android!
			const test = Ti.Utils.base64encode('test');
			should(test).be.an.Object();
			should(test.apiName).eql('Ti.Blob');
			if (OS_ANDROID) {
				should(test.type).eql(3); // Android-specific property, value of 3 indicates TYPE_STRING
			}
			should(test.text).eql('dGVzdA==');

			const blob = Ti.Utils.base64encode(test);
			// result here is a Ti.Blob
			should(blob).be.a.Object();
			should(blob.apiName).eql('Ti.Blob');
			should(blob.text).eql('ZEdWemRBPT0=');
		});

		it('Ti.Filesystem.File', () => {
			const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt');
			const blob = Ti.Utils.base64encode(f);

			// result here is a Ti.Blob
			should(blob).be.an.Object();
			should(blob.apiName).eql('Ti.Blob');
			should(blob.text).eql('SSBhbSBub3QgZW5jb2RlZCB5ZXQu');
		});
	});

	describe('#base64decode()', () => {
		it('is a Function', () => {
			should(Ti.Utils.base64decode).be.a.Function();
		});

		it('String', () => {
			// Basic tests
			const test = Ti.Utils.base64decode('dGVzdA==');
			should(test).be.a.Object();
			should(test.apiName).eql('Ti.Blob');
			should(test.text).eql('test');

			// Test string without padding
			should(!Ti.Utils.base64decode('eyJzdWIiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0IiwiYXVkIjoidGVzdCIsImp0aSI6ImxvTHM4d2o5aWxBQUtWckNxbzhaMFMiLCJpc3MiOiJodHRwczpcL1wvc3NvLmV4YW1wbGUuY29tIiwiaWF0IjoxNTI2MTY3NDc3LCJleHAiOjE1MjYxNjc0NzcsInBpLnRlc3QiOiJMSTRmMW81Q2pqU2tHU2xTanM0bHlPeVlROCJ9')).not.be.null();

			// More padding tests
			should(Ti.Utils.base64decode('Zg').text).eql('f');
			should(Ti.Utils.base64decode('Zm8').text).eql('fo');
			should(Ti.Utils.base64decode('Zm9v').text).eql('foo');
			should(Ti.Utils.base64decode('Zm9vYg').text).eql('foob');
			should(Ti.Utils.base64decode('Zm9vYmE').text).eql('fooba');
			should(Ti.Utils.base64decode('Zm9vYmFy').text).eql('foobar');
		});

		// FIXME Windows gives: 'base64decode: attempt to decode a value not in base64 char set'
		it.windowsBroken('Ti.Blob with text data', function () {
			const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/encodedFile.txt');
			const blob = Ti.Utils.base64decode(f.read());
			should(blob.text).eql('Decoding successful!');
		});

		it('Ti.Filesystem.File with text data', () => {
			const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/encodedFile.txt');
			const blob = Ti.Utils.base64decode(f);

			// result here is a Ti.Blob
			should(blob).be.an.Object();
			should(blob.apiName).eql('Ti.Blob');
			should(blob.text).eql('Decoding successful!');
		});

		// FIXME: How can I make this valid? The input needs to be valid base64...
		// An image can't be right. Maybe we can validate in UtilsModule that a given blob is non-binary?
		// it.windowsBroken('Ti.Filesystem.File with binary data', function () {
		// 	var binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png'),
		// 		blob = Ti.Utils.base64decode(binaryFile);
		//
		// 	// result here is a Ti.Blob
		// 	should(blob).be.a.Object();
		// 	should(blob.apiName).eql('Ti.Blob');
		// 	// ignore the actual decoded value...
		// });
	});

	describe('#md5HexDigest()', () => {
		it('is a Function', () => {
			should(Ti.Utils.md5HexDigest).be.a.Function();
		});

		it('String', () => {
			const test = Ti.Utils.md5HexDigest('test');
			should(test).be.a.String();
			should(test).be.eql('098f6bcd4621d373cade4e832627b4f6');
		});

		it('Ti.Blob with text data', () => {
			const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/file.txt');
			const test = Ti.Utils.md5HexDigest(f.read());
			should(test).be.a.String();
			should(test).eql('4fe8a693c64f93f65c5faf42dc49ab23'); // Windows Desktop gives: 'ab1600f840b927f80a3dc000c510d1d3'
		});

		it.windowsBroken('Ti.Blob with binary data', () => {
			const binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			const result = Ti.Utils.md5HexDigest(binaryFile.read());
			should(result).be.a.String();
			should(result).eql('803fd0b8dd9a3ca5238390732db54062');
		});
	});

	describe('#sha1()', () => {
		it('is a Function', () => {
			should(Ti.Utils.sha1).be.a.Function();
		});

		it('String', () => {
			const test = Ti.Utils.sha1('test');
			should(test).be.a.String();
			should(test).eql('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
		});

		it('Ti.Blob with text data', () => {
			const textFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt');
			const blob = textFile.read();
			should(Ti.Utils.sha1(blob)).eql('ddbb50fb5beea93d1d4913fc22355c84f22d43ed');
		});

		it('Ti.Blob with binary data', () => {
			const binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			const blob = binaryFile.read();
			should(Ti.Utils.sha1(blob)).eql('668e98c66d8a11ef38ab442d9d6d4a21d8593645');
		});
	});

	describe('#sha256()', () => {
		it('is a Function', () => {
			should(Ti.Utils.sha256).be.a.Function();
		});

		it('String', () => {
			const test = Ti.Utils.sha256('test');
			should(test).be.a.String();
			should(test).eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
		});

		it('Ti.Blob with text data', () => {
			const textFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'txtFiles/decodedFile.txt');
			const blob = textFile.read();
			should(Ti.Utils.sha256(blob)).eql('9f81cd4f510080f1da92386b391cf2539b21f6363df491b89787e50fbc33b2c3');
		});

		it('Ti.Blob with binary data', () => {
			const binaryFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			const blob = binaryFile.read();
			should(Ti.Utils.sha256(blob)).eql('54be80ae48e4242d56170248e730ffac60a2828d07260a048e2ac0fd62386234');
		});
	});

	it('TIMOB-25513', () => {
		const shortString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:1';
		const tiBase64ShortResult = Ti.Utils.base64encode(shortString);
		should(tiBase64ShortResult.text).eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDox');

		const longString = 'ABCDEFGHIJ1234567890ABCDEFGHIJ12|psndemo2|abcd:12345678901234567890';
		const tiBase64LongResult  = Ti.Utils.base64encode(longString);
		should(tiBase64LongResult.text).eql('QUJDREVGR0hJSjEyMzQ1Njc4OTBBQkNERUZHSElKMTJ8cHNuZGVtbzJ8YWJjZDoxMjM0NTY3ODkwMTIzNDU2Nzg5MA==');
	});
});
