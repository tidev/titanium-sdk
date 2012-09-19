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
	}

	this.name = "codec";
	this.tests = [
		{name: "testAPI"},
		{name: "testEncodeIntegers"},
		{name: "testDecodeIntegers"},
		{name: "testEncodeFloatingPoint"},
		{name: "testDecodeFloatingPoint"},
		{name: "testEncodeString"},
		{name: "testDecodeString"}
	]

	this.testAPI = function(testRun) {
		valueOf(testRun, Ti.Codec).shouldBeObject();

		var functions = ["encodeNumber", "decodeNumber", "encodeString", "decodeString", "getNativeByteOrder"];
		for (var i = 0; i < functions.length; i++) {
			valueOf(testRun, Ti.Codec[functions[i]]).shouldBeFunction();
		};

		valueOf(testRun, Ti.Codec.CHARSET_ASCII).shouldBe("ascii");
		valueOf(testRun, Ti.Codec.CHARSET_UTF8).shouldBe("utf8");
		valueOf(testRun, Ti.Codec.CHARSET_UTF16).shouldBe("utf16");
		valueOf(testRun, Ti.Codec.CHARSET_UTF16BE).shouldBe("utf16be");
		valueOf(testRun, Ti.Codec.CHARSET_UTF16LE).shouldBe("utf16le");

		valueOf(testRun, Ti.Codec.TYPE_BYTE).shouldBe("byte");
		valueOf(testRun, Ti.Codec.TYPE_SHORT).shouldBe("short");
		valueOf(testRun, Ti.Codec.TYPE_INT).shouldBe("int");
		valueOf(testRun, Ti.Codec.TYPE_LONG).shouldBe("long");
		valueOf(testRun, Ti.Codec.TYPE_FLOAT).shouldBe("float");
		valueOf(testRun, Ti.Codec.TYPE_DOUBLE).shouldBe("double");

		valueOf(testRun, Ti.Codec.BIG_ENDIAN).shouldBeNumber();
		valueOf(testRun, Ti.Codec.LITTLE_ENDIAN).shouldBeNumber();
		valueOf(testRun, Ti.Codec.getNativeByteOrder()).shouldBeOneOf([Ti.Codec.BIG_ENDIAN, Ti.Codec.LITTLE_ENDIAN]);

		finish(testRun);
	}

	this.testEncodeIntegers = function(testRun) {
		var buffer = Ti.createBuffer({ length: 8 });

		Ti.Codec.encodeNumber({
			source: 0x123456789a,
			dest: buffer,
			type: Ti.Codec.TYPE_LONG
		});

		if (Ti.Codec.getNativeByteOrder() == Ti.Codec.BIG_ENDIAN) {
			for (var i = 0; i < 3; i++) {
				valueOf(testRun, buffer[i]).shouldBe(0);
			}
			valueOf(testRun, buffer[3]).shouldBe(0x12);
			valueOf(testRun, buffer[4]).shouldBe(0x34);
			valueOf(testRun, buffer[5]).shouldBe(0x56);
			valueOf(testRun, buffer[6]).shouldBe(0x78);
			valueOf(testRun, buffer[7]).shouldBe(0x9a);
		} else {
			valueOf(testRun, buffer[4]).shouldBe(0x12);
			valueOf(testRun, buffer[3]).shouldBe(0x34);
			valueOf(testRun, buffer[2]).shouldBe(0x56);
			valueOf(testRun, buffer[1]).shouldBe(0x78);
			valueOf(testRun, buffer[0]).shouldBe(0x9a);
			for (var i = 5; i < 8; i++) {
				valueOf(testRun, buffer[i]).shouldBe(0);
			}
		}

		buffer.length = 10;
		buffer.clear();

		Ti.Codec.encodeNumber({
			source: 0x123456789a,
			dest: buffer,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 2
		});

		for (var i = 2; i < 5; i++) {
			valueOf(testRun, buffer[i]).shouldBe(0);
		}
		valueOf(testRun, buffer[5]).shouldBe(0x12);
		valueOf(testRun, buffer[6]).shouldBe(0x34);
		valueOf(testRun, buffer[7]).shouldBe(0x56);
		valueOf(testRun, buffer[8]).shouldBe(0x78);
		valueOf(testRun, buffer[9]).shouldBe(0x9a);

		buffer.length = 4;
		buffer.clear();

		// down casting discards the high bits (0x12)
		Ti.Codec.encodeNumber({
			source: 0x123456789a,
			dest: buffer,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});

		valueOf(testRun, buffer[0]).shouldBe(0x34);
		valueOf(testRun, buffer[1]).shouldBe(0x56);
		valueOf(testRun, buffer[2]).shouldBe(0x78);
		valueOf(testRun, buffer[3]).shouldBe(0x9a);

		buffer.length = 2;
		buffer.clear();

		// down casting discards the high bits (0x3)
		Ti.Codec.encodeNumber({
			source: 0x34567,
			dest: buffer,
			type: Ti.Codec.TYPE_SHORT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(testRun, buffer[0]).shouldBe(0x45);
		valueOf(testRun, buffer[1]).shouldBe(0x67);

		buffer.clear();
		buffer[0] = 63;
		Ti.Codec.encodeNumber({
			source: 63,
			dest: buffer,
			position: 1,
			type: Ti.Codec.TYPE_BYTE
		});
		valueOf(testRun, buffer[0]).shouldBe(buffer[1]);

		finish(testRun);
	}

	this.testDecodeIntegers = function(testRun) {
		var buffer = Ti.createBuffer({ length: 8 });
		buffer[0] = 0x9a;
		buffer[1] = 0x78;
		buffer[2] = 0x56;
		buffer[3] = 0x34;
		buffer[4] = 0x12;
		var n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		valueOf(testRun, n).shouldBe(0x123456789a);

		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 1
		});
		valueOf(testRun, n).shouldBe(0x78563412);

		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_SHORT,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});

		// down casting discards the low bits (0x563412)
		valueOf(testRun, n).shouldBe(0x789a);

		finish(testRun);
	}

	this.testEncodeFloatingPoint = function(testRun) {
		var buffer = Ti.createBuffer({ length: 8 });

		// 1/3 -> 0x3fd5555555555555
		Ti.Codec.encodeNumber({
			source: 1/3,
			dest: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(testRun, buffer[0]).shouldBe(0x3f);
		valueOf(testRun, buffer[1]).shouldBe(0xd5);
		for (var i = 2; i < 8; i++) {
			valueOf(testRun, buffer[i]).shouldBe(0x55);
		}

		// 1.23456789 -> 0x3ff3c0ca4283de1b
		buffer = Ti.createBuffer({
			value: 1.23456789,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});

		valueOf(testRun, buffer[0]).shouldBe(0x3f);
		valueOf(testRun, buffer[1]).shouldBe(0xf3);
		valueOf(testRun, buffer[2]).shouldBe(0xc0);
		valueOf(testRun, buffer[3]).shouldBe(0xca);
		valueOf(testRun, buffer[4]).shouldBe(0x42);
		valueOf(testRun, buffer[5]).shouldBe(0x83);
		valueOf(testRun, buffer[6]).shouldBe(0xde);
		valueOf(testRun, buffer[7]).shouldBe(0x1b);

		// 1.2345 -> 0x3f9e0419 (float)
		buffer.clear();
		buffer.length = 4;
		Ti.Codec.encodeNumber({
			source: 1.2345,
			dest: buffer,
			type: Ti.Codec.TYPE_FLOAT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(testRun, buffer[0]).shouldBe(0x3f);
		valueOf(testRun, buffer[1]).shouldBe(0x9e);
		valueOf(testRun, buffer[2]).shouldBe(0x04);
		valueOf(testRun, buffer[3]).shouldBe(0x19);

		finish(testRun);
	}

	this.testDecodeFloatingPoint = function(testRun) {
		var buffer = Ti.createBuffer({ length: 8 });
		// Should be ~1/3
		buffer[0] = 0x3f;
		buffer[1] = 0xd5;
		for (var i = 2; i < 8; i++) {
			buffer[i] = 0x55;
		}

		var n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(testRun, n).shouldBe(1/3);

		// 0x3ff3c0ca4283de1b -> 1.23456789
		buffer.clear();
		buffer.length = 8;
		buffer[0] = 0x3f;
		buffer[1] = 0xf3;
		buffer[2] = 0xc0;
		buffer[3] = 0xca;
		buffer[4] = 0x42;
		buffer[5] = 0x83;
		buffer[6] = 0xde;
		buffer[7] = 0x1b;

		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_DOUBLE,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});
		valueOf(testRun, n).shouldBe(1.23456789);

		// 0x3f9e0419 ~> 1.2345 (float / little endian)
		buffer.clear();
		buffer.length = 4;
		buffer[0] = 0x19;
		buffer[1] = 0x04;
		buffer[2] = 0x9e;
		buffer[3] = 0x3f;
		n = Ti.Codec.decodeNumber({
			source: buffer,
			type: Ti.Codec.TYPE_FLOAT,
			byteOrder: Ti.Codec.LITTLE_ENDIAN
		});
		valueOf(testRun, n.toFixed(4)).shouldBe(1.2345);

		finish(testRun);
	}

	this.testEncodeString = function(testRun) {
		var PHRASE = "Wer reitet so spät durch Nacht und Wind?";
		var buffer = Ti.createBuffer({ length: 1024 });
		var length = Ti.Codec.encodeString({
			source: PHRASE,
			dest: buffer
		});
		valueOf(testRun, length).shouldBe(PHRASE.length + 1); // +1 for the umlaut char set byte
		var umlautLoc = PHRASE.indexOf('ä');
		valueOf(testRun, buffer[umlautLoc]).shouldBe(0xc3); // C3 char set in utf-8
		valueOf(testRun, buffer[umlautLoc + 1]).shouldBe(0xa4); // umlaut-a itself

		buffer.clear();
		buffer.length = 1024;
		length = Ti.Codec.encodeString({
			source: PHRASE,
			dest: buffer,
			charset: Ti.Codec.CHARSET_UTF16
		});
		valueOf(testRun, length).shouldBe(((PHRASE.length) * 2) + 2); // The final "+ 2" is for the BOM.
		buffer.length = length;
		// round trip?
		valueOf(testRun,  Ti.Codec.decodeString({ source: buffer, charset: Ti.Codec.CHARSET_UTF16 })).shouldBe(PHRASE);

		finish(testRun);
	}

	this.testDecodeString = function(testRun) {
		var TEST = "spät";
		var buffer = Ti.createBuffer({ length: 5 });
		buffer[0] = 0x73; // s
		buffer[1] = 0x70; // p
		buffer[2] = 0xc3; // char table
		buffer[3] = 0xa4; // umlaut-a
		buffer[4] = 0x74; // t
		valueOf(testRun, Ti.Codec.decodeString({ source: buffer, charset: Ti.Codec.CHARSET_UTF8 } )).shouldBe(TEST);

		// UTF-16
		buffer.clear();
		buffer.length = 10; // BOM=2, then 4 chars * 2

		// BOM: Little Endian Encoding
		buffer[0] = 0xff;
		buffer[1] = 0xfe;
		// "s"
		buffer[2] = 0x73;
		buffer[3] = 0x00;
		// "p"
		buffer[4] = 0x70;
		buffer[5] = 0x00;
		// "ä"
		buffer[6] = 0xe4;
		buffer[7] = 0x00;
		// "t"
		buffer[8] = 0x74;
		buffer[9] = 0x00;
		valueOf(testRun, Ti.Codec.decodeString({ source: buffer, charset: Ti.Codec.CHARSET_UTF16 })).shouldBe(TEST);

		// BOM: Big Endian Encoding
		buffer[1] = 0xff;
		buffer[0] = 0xfe;
		// "s"
		buffer[3] = 0x73;
		buffer[2] = 0x00;
		// "p"
		buffer[5] = 0x70;
		buffer[4] = 0x00;
		// "ä"
		buffer[7] = 0xe4;
		buffer[6] = 0x00;
		// "t"
		buffer[9] = 0x74;
		buffer[8] = 0x00;
		valueOf(testRun, Ti.Codec.decodeString({ source: buffer, charset: Ti.Codec.CHARSET_UTF16 })).shouldBe(TEST);

		// Test decoding of a string with empty data after it using "length"
		buffer = Ti.createBuffer({ value: "The system is down", length: 100 });
		valueOf(testRun, buffer.length).shouldBe(100);
		var str = Ti.Codec.decodeString({ source: buffer, length: 18 });
		valueOf(testRun, str).shouldBe("The system is down");

		finish(testRun);
	}
}
