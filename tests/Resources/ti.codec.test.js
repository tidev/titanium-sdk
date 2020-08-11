/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Codec', function () {
	it('apiName', function () {
		should(Ti.Codec).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Codec.apiName).be.eql('Ti.Codec');
	});

	it('testAPI', function () {
		should(Ti.Codec).be.an.Object();
		var functions = [ 'encodeNumber', 'decodeNumber', 'encodeString', 'decodeString', 'getNativeByteOrder' ];
		for (var i = 0; i < functions.length; i++) {
			should(Ti.Codec[functions[i]]).be.a.Function();
		}
		should(Ti.Codec.CHARSET_ASCII).eql('ascii');
		should(Ti.Codec.CHARSET_UTF8).eql('utf8');
		should(Ti.Codec.CHARSET_UTF16).eql('utf16');
		should(Ti.Codec.CHARSET_UTF16BE).eql('utf16be');
		should(Ti.Codec.CHARSET_UTF16LE).eql('utf16le');
		should(Ti.Codec.TYPE_BYTE).eql('byte');
		should(Ti.Codec.TYPE_SHORT).eql('short');
		should(Ti.Codec.TYPE_INT).eql('int');
		should(Ti.Codec.TYPE_LONG).eql('long');
		should(Ti.Codec.TYPE_FLOAT).eql('float');
		should(Ti.Codec.TYPE_DOUBLE).eql('double');
		should(Ti.Codec.BIG_ENDIAN).be.a.Number();
		should(Ti.Codec.LITTLE_ENDIAN).be.a.Number();
		console.info(Ti.Codec.getNativeByteOrder());
		console.info(Ti.Codec.BIG_ENDIAN, Ti.Codec.LITTLE_ENDIAN);
		should([ Ti.Codec.BIG_ENDIAN, Ti.Codec.LITTLE_ENDIAN ]).containEql(Ti.Codec.getNativeByteOrder());
	});

	it('testEncodeIntegers', function () {
		var buffer = Ti.createBuffer({
				length: 8
			}),
			i;
		Ti.Codec.encodeNumber({
			source: 78187493530,
			dest: buffer,
			type: Ti.Codec.TYPE_LONG
		});
		if (Ti.Codec.getNativeByteOrder() == Ti.Codec.BIG_ENDIAN) { // eslint-disable-line eqeqeq
			for (i = 0; i < 3; i++) {
				should(buffer[i]).eql(0);
			}
			should(buffer[3]).eql(18);
			should(buffer[4]).eql(52);
			should(buffer[5]).eql(86);
			should(buffer[6]).eql(120);
			should(buffer[7]).eql(154);
		} else {
			should(buffer[4]).eql(18);
			should(buffer[3]).eql(52);
			should(buffer[2]).eql(86);
			should(buffer[1]).eql(120);
			should(buffer[0]).eql(154);
			for (i = 5; i < 8; i++) {
				should(buffer[i]).eql(0);
			}
		}
		buffer.length = 10;
		buffer.clear();
		Ti.Codec.encodeNumber({
			source: 78187493530,
			dest: buffer,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 2
		});
		for (i = 2; i < 5; i++) {
			should(buffer[i]).eql(0);
		}
		should(buffer[5]).eql(18);
		should(buffer[6]).eql(52);
		should(buffer[7]).eql(86);
		should(buffer[8]).eql(120);
		should(buffer[9]).eql(154);
		buffer.length = 4;
		buffer.clear();
		// down casting discards the high bits (0x12)
		Ti.Codec.encodeNumber({
			source: 78187493530,
			dest: buffer,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(buffer[0]).eql(52);
		should(buffer[1]).eql(86);
		should(buffer[2]).eql(120);
		should(buffer[3]).eql(154);
		buffer.length = 2;
		buffer.clear();
		// down casting discards the high bits (0x3)
		Ti.Codec.encodeNumber({
			source: 214375,
			dest: buffer,
			type: Ti.Codec.TYPE_SHORT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(buffer[0]).eql(69);
		should(buffer[1]).eql(103);
		buffer.clear();
		buffer[0] = 63;
		Ti.Codec.encodeNumber({
			source: 63,
			dest: buffer,
			position: 1,
			type: Ti.Codec.TYPE_BYTE
		});
		should(buffer[0]).eql(buffer[1]);
	});

	it('testDecodeIntegers', function () {
		var buffer = Ti.createBuffer({
			length: 8
		});
		buffer[0] = 154;
		buffer[1] = 120;
		buffer[2] = 86;
		buffer[3] = 52;
		buffer[4] = 18;
		var n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		should(n).eql(78187493530);
		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 1
		});
		should(n).eql(2018915346);
		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_SHORT,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		// down casting discards the low bits (0x563412)
		should(n).eql(30874);
	});

	it('testEncodeFloatingPoint', function () {
		var buffer = Ti.createBuffer({
			length: 8
		});
		// 1/3 -> 0x3fd5555555555555
		Ti.Codec.encodeNumber({
			source: 1 / 3,
			dest: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(buffer[0]).eql(63);
		should(buffer[1]).eql(213);
		for (var i = 2; i < 8; i++) {
			should(buffer[i]).eql(85);
		}
		// 1.23456789 -> 0x3ff3c0ca4283de1b
		buffer = Ti.createBuffer({
			value: 1.23456789,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(buffer[0]).eql(63);
		should(buffer[1]).eql(243);
		should(buffer[2]).eql(192);
		should(buffer[3]).eql(202);
		should(buffer[4]).eql(66);
		should(buffer[5]).eql(131);
		should(buffer[6]).eql(222);
		should(buffer[7]).eql(27);
		// 1.2345 -> 0x3f9e0419 (float)
		buffer.clear();
		buffer.length = 4;
		Ti.Codec.encodeNumber({
			source: 1.2345,
			dest: buffer,
			type: Ti.Codec.TYPE_FLOAT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(buffer[0]).eql(63);
		should(buffer[1]).eql(158);
		should(buffer[2]).eql(4);
		should(buffer[3]).eql(25);
	});

	it('testDecodeFloatingPoint', function () {
		var buffer = Ti.createBuffer({
			length: 8
		});
		// Should be ~1/3
		buffer[0] = 63;
		buffer[1] = 213;
		for (var i = 2; i < 8; i++) {
			buffer[i] = 85;
		}
		var n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(n).eql(1 / 3);
		// 0x3ff3c0ca4283de1b -> 1.23456789
		buffer.clear();
		buffer.length = 8;
		buffer[0] = 63;
		buffer[1] = 243;
		buffer[2] = 192;
		buffer[3] = 202;
		buffer[4] = 66;
		buffer[5] = 131;
		buffer[6] = 222;
		buffer[7] = 27;
		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		should(n).eql(1.23456789);
		// 0x3f9e0419 ~> 1.2345 (float / little endian)
		buffer.clear();
		buffer.length = 4;
		buffer[0] = 25;
		buffer[1] = 4;
		buffer[2] = 158;
		buffer[3] = 63;
		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_FLOAT,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		should(n.toFixed(4)).eql('1.2345');
	});

	it('testEncodeString', function () {
		var PHRASE = 'Wer reitet so spät durch Nacht und Wind?';
		var buffer = Ti.createBuffer({
			length: 1024
		});
		var length = Ti.Codec.encodeString({
			source: PHRASE,
			dest: buffer
		});
		should(length).eql(PHRASE.length + 1);
		// +1 for the umlaut char set byte
		var umlautLoc = PHRASE.indexOf('ä');
		should(buffer[umlautLoc]).eql(195);
		// C3 char set in utf-8
		should(buffer[umlautLoc + 1]).eql(164);
		// umlaut-a itself
		buffer.clear();
		buffer.length = 1024;
		length = Ti.Codec.encodeString({
			source: PHRASE,
			dest: buffer,
			charset: Ti.Codec.CHARSET_UTF16
		});
		should(length).eql(2 * PHRASE.length + 2);
		// The final '+ 2' is for the BOM.
		buffer.length = length;
		// round trip?
		should(Ti.Codec.decodeString({
			source: buffer,
			charset: Ti.Codec.CHARSET_UTF16
		})).eql(PHRASE);
	});

	it('testDecodeString', function () {
		var TEST = 'spät';
		var buffer = Ti.createBuffer({
			length: 5
		});
		buffer[0] = 115;
		// s
		buffer[1] = 112;
		// p
		buffer[2] = 195;
		// char table
		buffer[3] = 164;
		// umlaut-a
		buffer[4] = 116;
		// t
		should(Ti.Codec.decodeString({
			source: buffer,
			charset: Ti.Codec.CHARSET_UTF8
		})).eql(TEST);
		// UTF-16
		buffer.clear();
		buffer.length = 10;
		// BOM=2, then 4 chars * 2
		// BOM: Little Endian Encoding
		buffer[0] = 255;
		buffer[1] = 254;
		// 's'
		buffer[2] = 115;
		buffer[3] = 0;
		// 'p'
		buffer[4] = 112;
		buffer[5] = 0;
		// 'ä'
		buffer[6] = 228;
		buffer[7] = 0;
		// 't'
		buffer[8] = 116;
		buffer[9] = 0;
		should(Ti.Codec.decodeString({
			source: buffer,
			charset: Ti.Codec.CHARSET_UTF16
		})).eql(TEST);
		// BOM: Big Endian Encoding
		buffer[1] = 255;
		buffer[0] = 254;
		// 's'
		buffer[3] = 115;
		buffer[2] = 0;
		// 'p'
		buffer[5] = 112;
		buffer[4] = 0;
		// 'ä'
		buffer[7] = 228;
		buffer[6] = 0;
		// 't'
		buffer[9] = 116;
		buffer[8] = 0;
		should(Ti.Codec.decodeString({
			source: buffer,
			charset: Ti.Codec.CHARSET_UTF16
		})).eql(TEST);
		// Test decoding of a string with empty data after it using 'length'
		buffer = Ti.createBuffer({
			value: 'The system is down',
			length: 100
		});
		should(buffer.length).eql(100);
		var str = Ti.Codec.decodeString({
			source: buffer,
			length: 18
		});
		should(str).eql('The system is down');
	});

	describe('#encodeNumber', function () {
		it('should throw Error when "dest" not specified', function () {
			should(function () {
				Ti.Codec.encodeNumber({
					source: 123,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when "source" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.encodeNumber({
					dest: buffer,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when "type" not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.encodeNumber({
					source: 123,
					dest: buffer
				});
			}).throw();
		});
	});

	describe('#decodeNumber', function () {
		it('should throw Error when source not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.decodeNumber({
					dest: buffer,
					type: Ti.Codec.TYPE_LONG,
				});
			}).throw();
		});

		it('should throw Error when type not specified', function () {
			should(function () {
				var buffer = Ti.createBuffer({
					length: 8
				});
				Ti.Codec.decodeNumber({
					source: 123,
					dest: buffer
				});
			}).throw();
		});
	});
});
