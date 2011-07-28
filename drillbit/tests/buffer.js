describe("Ti.Buffer tests", {

	testAPI: function() {
		valueOf(Ti.createBuffer).shouldBeFunction();

		var buffer = Ti.createBuffer();
		valueOf(buffer).shouldBeObject();
		valueOf(buffer.length).shouldBe(0);
		var functions = ['append', 'insert', 'copy', 'clone', 'fill', 'clear', 'release', 'toString', 'toBlob'];
		for (var i = 0; i < functions.length; i++) {
			valueOf(buffer[functions[i]]).shouldBeFunction();
		};
	},

	testLength: function() {
		var buffer = Ti.createBuffer();
		valueOf(buffer.length).shouldBe(0);

		buffer = Ti.createBuffer({ length: 100 });
		valueOf(buffer.length).shouldBe(100);
		for (var i = 0; i < 100; i++) {
			valueOf(buffer[i]).shouldBe(0);
		}
	},

	testAppend: function() {
		var buffer1 = Ti.createBuffer({ length: 20 });
		var buffer2 = Ti.createBuffer({ length: 5 });
		buffer2[0] = 100;
		buffer2[1] = 101;

		var n = buffer1.append(buffer2);
		valueOf(buffer1.length).shouldBe(25);
		valueOf(buffer1[20]).shouldBe(100);
		valueOf(buffer1[21]).shouldBe(101);
		valueOf(n).shouldBe(buffer2.length);

		buffer1 = Ti.createBuffer({ length: 20 });
		buffer2 = Ti.createBuffer({ length: 5 });
		buffer2[3] = 100;
		buffer2[4] = 101;

		n = buffer1.append(buffer2, 3, 2);
		valueOf(buffer1.length).shouldBe(22);
		valueOf(buffer1[20]).shouldBe(100);
		valueOf(buffer1[21]).shouldBe(101);
		valueOf(n).shouldBe(2);

		valueOf(function() {
			// requires at least 1 arg
			buffer1.append();
		}).shouldThrowException();

		valueOf(function() {
			// 99 > buffer2.length
			buffer1.append(buffer2, 0, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position / 100 length > buffer2.length
			buffer1.append(buffer2, 99, 100);
		}).shouldThrowException();
	},

	testInsert: function() {
		var buffer1 = Ti.createBuffer({ length: 20 });
		var buffer2 = Ti.createBuffer({ length: 5 });
		buffer2[0] = 103;
		buffer2[1] = 104;

		var n = buffer1.insert(buffer2, 3);
		valueOf(buffer1.length).shouldBe(25);
		valueOf(buffer1[3]).shouldBe(103);
		valueOf(buffer1[4]).shouldBe(104);
		valueOf(n).shouldBe(5);

		buffer2[2] = 105;
		n = buffer1.insert(buffer2, 3, 1, 2);
		valueOf(buffer1.length).shouldBe(27);
		valueOf(buffer1[3]).shouldBe(104);
		valueOf(buffer1[4]).shouldBe(105);
		valueOf(buffer1[5]).shouldBe(103);
		valueOf(buffer1[6]).shouldBe(104);
		valueOf(n).shouldBe(2);

		valueOf(function() {
			// insert requires at least 2 args
			buffer1.insert(buffer2);
		}).shouldThrowException();

		valueOf(function() {
			// 99 > buffer2.length
			buffer1.insert(buffer2, 0, 0, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position > buffer1.length
			buffer1.insert(buffer2, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position / 100 length > buffer2.length
			buffer1.insert(buffer2, 0, 99, 100);
		}).shouldThrowException();
	},
	
	testInsertBlogExample: function() {
		var buffer = Ti.createBuffer({ length : 2});
		buffer[0] = 1;
		buffer[1] = 3;

		var buffer2 = Ti.createBuffer({ length : 1});
		buffer2[0] = 2;
		buffer.insert(buffer2, 1);

		valueOf(String(buffer[0]) + String(buffer[1]) + String(buffer[2])).shouldBe("123");
		valueOf(buffer.length).shouldBe(3);
		valueOf(buffer[0]).shouldBe(1);
		valueOf(buffer[1]).shouldBe(2);
		valueOf(buffer[2]).shouldBe(3);
		
		valueOf(buffer2.length).shouldBe(1); //unchanged
		valueOf(buffer2[0]).shouldBe(2);
	},

	testCopy: function() {
		var buffer1 = Ti.createBuffer({ length: 20 });
		var buffer2 = Ti.createBuffer({ length: 5 });
		buffer2[0] = 109;
		buffer2[1] = 110;

		var n = buffer1.copy(buffer2, 0);
		valueOf(buffer1.length).shouldBe(20);
		valueOf(buffer1[0]).shouldBe(109);
		valueOf(buffer1[1]).shouldBe(110);
		valueOf(n).shouldBe(5);

		n = buffer1.copy(buffer2, 15, 0, 2);
		valueOf(buffer1.length).shouldBe(20);
		valueOf(buffer1[15]).shouldBe(109);
		valueOf(buffer1[16]).shouldBe(110);
		valueOf(n).shouldBe(2);

		valueOf(function(){
			// copy requires at least 1 arg
			buffer1.copy();
		}).shouldThrowException();

		valueOf(function() {
			// 99 > buffer2.length
			buffer1.copy(buffer2, 0, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position / 100 length > buffer2.length
			buffer1.copy(buffer2, 99, 100);
		}).shouldThrowException();
	},

	testClone: function() {
		var buffer1 = Ti.createBuffer({ length: 20 });
		buffer1[0] = 100;
		buffer1[6] = 103;
		buffer1[12] = 106;
		buffer1[18] = 109;

		var buffer2 = buffer1.clone();
		valueOf(buffer2.length).shouldBe(20);
		valueOf(buffer2).shouldNotBeExactly(buffer1);
		valueOf(buffer2).shouldMatchArray(buffer1);

		buffer2 = buffer1.clone(6, 13);
		valueOf(buffer2.length).shouldBe(13);
		valueOf(buffer2[0]).shouldBe(103);
		valueOf(buffer2[6]).shouldBe(106);
		valueOf(buffer2[12]).shouldBe(109);

		valueOf(function() {
			// 99 > buffer1.length
			buffer1.clone(0, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position / 100 length > buffer1.length
			buffer1.clone(99, 100);
		}).shouldThrowException();
	},

	testFill: function() {
		var buffer = Ti.createBuffer({ length: 20 });
		buffer.fill(100);

		for (var i = 0; i < 20; i++) {
			valueOf(buffer[i]).shouldBe(100);
		}

		buffer.fill(101, 5, 10);
		valueOf(buffer[0]).shouldBe(100);
		for (var i = 5; i < 10; i++) {
			valueOf(buffer[i]).shouldBe(101);
		}

		valueOf(function() {
			// fill requires at least 1 arg
			buffer.fill();
		}).shouldThrowException();

		valueOf(function() {
			// 99 > buffer.length
			buffer.fill(102, 0, 99);
		}).shouldThrowException();

		valueOf(function() {
			// 99 position / 100 length > buffer1.length
			buffer.fill(100, 99, 100);
		}).shouldThrowException();
	},

	testClear: function() {
		var buffer = Ti.createBuffer({ length: 100 });
		buffer.fill(99);
		buffer.clear();

		valueOf(buffer.length).shouldBe(100);
		for (var i = 0; i < 100; i++) {
			valueOf(buffer[i]).shouldBe(0);
		}
	},

	testRelease: function() {
		var buffer = Ti.createBuffer({ length: 100 });
		buffer.release();
		valueOf(buffer.length).shouldBe(0);
	},

	testToStringAndBlob: function() {
		// just a simple ascii string
		var buffer = Ti.createBuffer({ length: 12 });
		buffer[0] = 97; // a
		buffer[1] = 112; // p
		buffer[2] = 112; // p
		buffer[3] = 99; // c
		buffer[4] = 101; // e
		buffer[5] = 108; // l
		buffer[6] = 101; // e
		buffer[7] = 114; // r
		buffer[8] = 97; // a
		buffer[9] = 116; // t
		buffer[10] = 111; // o
		buffer[11] = 114; // r

		valueOf(buffer.toString()).shouldBe("appcelerator");

		var blob = buffer.toBlob();
		valueOf(blob.length).shouldBe(buffer.length);
		valueOf(blob.text).shouldBe("appcelerator");
	},

	testAutoEncode: function() {
		// default UTF8
		var buffer = Ti.createBuffer({ value: "appcelerator" });
		valueOf(buffer.length).shouldBe(12);
		valueOf(buffer[0]).shouldBe(97); // a
		valueOf(buffer[1]).shouldBe(112); // p
		valueOf(buffer[2]).shouldBe(112); // p
		valueOf(buffer[3]).shouldBe(99); // c
		valueOf(buffer[4]).shouldBe(101); // e
		valueOf(buffer[5]).shouldBe(108); // l
		valueOf(buffer[6]).shouldBe(101); // e
		valueOf(buffer[7]).shouldBe(114); // r
		valueOf(buffer[8]).shouldBe(97); // a
		valueOf(buffer[9]).shouldBe(116); // t
		valueOf(buffer[10]).shouldBe(111); // o
		valueOf(buffer[11]).shouldBe(114); // r

		// UTF-16
		buffer = Ti.createBuffer({ value: "appcelerator", type: Ti.Codec.CHARSET_UTF16 });
		var length = 24;
		var start = 0;

		// some impls will add a UTF-16 BOM
		// http://en.wikipedia.org/wiki/UTF-16/UCS-2#Byte_order_encoding_schemes
		if (buffer[0] == 0xFF && buffer[1] == 0xFE) {
			// UTF-16 BE
			length = 26;
			start = 1;
		} else if (buffer[0] == 0xFE && buffer[1] == 0xFF) {
			// UTF-16 LE
			length = 26;
			start = 2;
		}
		
		valueOf(buffer.length).shouldBe(length);
		valueOf(buffer.byteOrder).shouldBe(Ti.Codec.getNativeByteOrder());
		valueOf(buffer[start+1]).shouldBe(97); // a
		valueOf(buffer[start+3]).shouldBe(112); // p
		valueOf(buffer[start+5]).shouldBe(112); // p
		valueOf(buffer[start+7]).shouldBe(99); // c
		valueOf(buffer[start+9]).shouldBe(101); // e
		valueOf(buffer[start+11]).shouldBe(108); // l
		valueOf(buffer[start+13]).shouldBe(101); // e
		valueOf(buffer[start+15]).shouldBe(114); // r
		valueOf(buffer[start+17]).shouldBe(97); // a
		valueOf(buffer[start+19]).shouldBe(116); // t
		valueOf(buffer[start+21]).shouldBe(111); // o
		valueOf(buffer[start+23]).shouldBe(114); // r

		// 8 Byte long in Big Endian (most significant byte first)
		buffer = Ti.createBuffer({ value: 0x12345678, type: Ti.Codec.TYPE_LONG, byteOrder: Ti.Codec.BIG_ENDIAN });
		valueOf(buffer.byteOrder).shouldBe(Ti.Codec.BIG_ENDIAN);
		valueOf(buffer.length).shouldBe(8);
		for (var i = 0; i < 4; i++) {
			valueOf(buffer[i]).shouldBe(0);
		}
		valueOf(buffer[4]).shouldBe(0x12);
		valueOf(buffer[5]).shouldBe(0x34);
		valueOf(buffer[6]).shouldBe(0x56);
		valueOf(buffer[7]).shouldBe(0x78);

		// 4 byte int in Little Endian (least significant byte first)
		buffer = Ti.createBuffer({ value: 0x12345678, type: Ti.Codec.TYPE_INT, byteOrder: Ti.Codec.LITTLE_ENDIAN });
		valueOf(buffer.byteOrder).shouldBe(Ti.Codec.LITTLE_ENDIAN);		
		valueOf(buffer[0]).shouldBe(0x78);
		valueOf(buffer[1]).shouldBe(0x56);
		valueOf(buffer[2]).shouldBe(0x34);
		valueOf(buffer[3]).shouldBe(0x12);
	},

	options: {
		forceBuild: true
	}
});