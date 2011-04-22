describe("Ti.Codec tests", {
	testAPI: function() {
		valueOf(Ti.Codec).shouldBeObject();

		var functions = ["encodeNumber", "decodeNumber", "encodeString", "decodeString", "getNativeByteOrder"];
		for (var i = 0; i < functions.length; i++) {
			valueOf(Ti.Codec[functions[i]]).shouldBeFunction();
		};

		valueOf(Ti.Codec.CHARSET_ASCII).shouldBe("ascii");
		valueOf(Ti.Codec.CHARSET_UTF8).shouldBe("utf8");
		valueOf(Ti.Codec.CHARSET_UTF16).shouldBe("utf16");
		valueOf(Ti.Codec.CHARSET_UTF16BE).shouldBe("utf16be");
		valueOf(Ti.Codec.CHARSET_UTF16LE).shouldBe("utf16le");

		valueOf(Ti.Codec.TYPE_BYTE).shouldBe("byte");
		valueOf(Ti.Codec.TYPE_SHORT).shouldBe("short");
		valueOf(Ti.Codec.TYPE_INT).shouldBe("int");
		valueOf(Ti.Codec.TYPE_LONG).shouldBe("long");
		valueOf(Ti.Codec.TYPE_FLOAT).shouldBe("float");
		valueOf(Ti.Codec.TYPE_DOUBLE).shouldBe("double");

		valueOf(Ti.Codec.BIG_ENDIAN).shouldBeNumber();
		valueOf(Ti.Codec.LITTLE_ENDIAN).shouldBeNumber();
		valueOf(Ti.Codec.nativeByteOrder).shouldBeOneOf([Ti.Codec.BIG_ENDIAN, Ti.Codec.LITTLE_ENDIAN]);
	},

	testEncodeNumber: function() {
		var buffer = Ti.createBuffer({ length: 8 });

		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_LONG
		});

		if (Ti.Codec.nativeByteOrder == Ti.Codec.BIG_ENDIAN) {
			for (var i = 0; i < 3; i++) {
				valueOf(buffer[i]).shouldBe(0);
			}
			valueOf(buffer[3]).shouldBe(0x12);
			valueOf(buffer[4]).shouldBe(0x34);
			valueOf(buffer[5]).shouldBe(0x56);
			valueOf(buffer[6]).shouldBe(0x78);
			valueOf(buffer[7]).shouldBe(0x9a);
		} else {
			valueOf(buffer[4]).shouldBe(0x12);
			valueOf(buffer[3]).shouldBe(0x34);
			valueOf(buffer[2]).shouldBe(0x56);
			valueOf(buffer[1]).shouldBe(0x78);
			valueOf(buffer[0]).shouldBe(0x9a);
			for (var i = 5; i < 8; i++) {
				valueOf(buffer[i]).shouldBe(0);
			}
		}

		buffer.length = 10;
		buffer.clear();

		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_LONG,
			byteOrder: Ti.Codec.BIG_ENDIAN,
			position: 2
		});

		for (var i = 2; i < 5; i++) {
			valueOf(buffer[i]).shouldBe(0);
		}
		valueOf(buffer[5]).shouldBe(0x12);
		valueOf(buffer[6]).shouldBe(0x34);
		valueOf(buffer[7]).shouldBe(0x56);
		valueOf(buffer[8]).shouldBe(0x78);
		valueOf(buffer[9]).shouldBe(0x9a);

		buffer.length = 4;
		buffer.clear();

		Ti.Codec.encodeNumber({
			dest: buffer,
			data: 0x123456789a,
			type: Ti.Codec.TYPE_INT,
			byteOrder: Ti.Codec.BIG_ENDIAN
		});

		valueOf(buffer[0]).shouldBe(0x34);
		valueOf(buffer[1]).shouldBe(0x56);
		valueOf(buffer[2]).shouldBe(0x78);
		valueOf(buffer[3]).shouldBe(0x9a);
	},
	
	options: {
		forceBuild: true
	}
});