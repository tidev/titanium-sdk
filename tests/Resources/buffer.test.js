/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint security/detect-new-buffer: "off" */
/* eslint node/no-deprecated-api: ["error", { ignoreGlobalItems: ['new Buffer()']}]  */
/* eslint node/no-unsupported-features/node-builtins: ["error", { version: ">=8.2.0" }] */
'use strict';
const should = require('./utilities/assertions');
let BufferModule;
const encodings = [ 'utf8', 'utf-8', 'ucs2', 'ucs-2', 'ascii', 'latin1', 'binary', 'utf16le', 'utf-16le' ];

describe('buffer', () => {
	it('can be loaded as a core module', () => {
		BufferModule = require('buffer');
		should.exist(BufferModule);
	});

	it('.INSPECT_MAX_BYTES', () => {
		should(BufferModule.INSPECT_MAX_BYTES).eql(50);
	});

	it('.kMaxLength', () => {
		should(BufferModule.kMaxLength).eql(2147483647);
	});

	it('.kStringMaxLength', () => {
		should(BufferModule.kStringMaxLength).eql(1073741799);
	});

	it('.constants', () => {
		should(BufferModule.constants.MAX_LENGTH).eql(2147483647);
		should(BufferModule.constants.MAX_STRING_LENGTH).eql(1073741799);
	});

	describe('#transcode()', () => {
		it('is a function', () => {
			should(BufferModule.transcode).be.a.Function();
		});

		it.allBroken('transcodes a Buffer from one encoding to another', () => {
			// TODO: Implement #transcode()
		});
	});
});

describe('Buffer', () => {
	it('is available off the \'buffer\' module as Buffer', () => {
		// eslint-disable-next-line node/prefer-global/buffer
		should.exist(BufferModule.Buffer);
	});

	it('is available off global', () => {
		should.exist(global.Buffer);
	});

	describe('constructor', () => {
		before(() => {
			process.noDeprecation = true;
		});

		after(() => {
			process.noDeprecation = false;
		});

		it('should allocate a new Buffer using an array of octets', () => {
			const arr = [ 0x54, 0x69, 0x74, 0x61, 0x6e, 0x69, 0x75, 0x6d ];
			const buf = new Buffer(arr);
			for (let i = 0; i < arr.length; i++) {
				should(buf[i]).eql(arr[i]);
			}
		});

		it('should copy the passed buffer onto a new buffer instance', () => {
			const buf1 = new Buffer('buffer');
			const buf2 = new Buffer(buf1);
			buf1[0] = 0x61;
			should(buf1.toString()).eql('auffer');
			should(buf2.toString()).eql('buffer');

			const buf3 = new Uint8Array(2);
			buf3[0] = 0x54;
			buf3[1] = 0x69;
			const buf4 = new Buffer(buf3);
			buf3[0] = 0x74;
			should(buf3[0]).eql(0x74);
			should(buf4[0]).eql(0x54);
		});

		it('should allocate a new buffer with given size', () => {
			const buf = new Buffer(10);
			should(buf.length).eql(10);
		});

		it('should create a new Buffer containing the passed string', () => {
			const text = 'this is a tést';
			const buf1 = new Buffer(text);
			const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');
			should(buf1.toString()).eql(text);
			should(buf2.toString()).eql(text);
		});
	});

	describe('.from()', () => {
		it('is a function', () => {
			should(Buffer.from).be.a.Function();
		});

		it('should allocate a new Buffer using an array of octets', () => {
			const arr = [ 0x62, 0x75, 0x66, 0x66, 0x65, 0x72 ];
			const buf = Buffer.from(arr);
			for (let i = 0; i < arr.length; i++) {
				should(buf[i]).eql(arr[i]);
			}
		});

		it('should copy the passed buffer onto a new buffer instance', () => {
			const buf1 = Buffer.from('buffer');
			const buf2 = Buffer.from(buf1);
			buf1[0] = 0x61;
			should(buf1.toString()).eql('auffer');
			should(buf2.toString()).eql('buffer');

			const buf3 = new Uint8Array(2);
			buf3[0] = 0x54;
			buf3[1] = 0x69;
			const buf4 = Buffer.from(buf3);
			buf3[0] = 0x74;
			should(buf3[0]).eql(0x74);
			should(buf4[0]).eql(0x54);
		});

		it('should create a new Buffer containing the passed string', () => {
			const text = 'this is a tést';
			const buf1 = Buffer.from(text);
			const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');
			should(buf1.toString()).eql(text);
			should(buf2.toString()).eql(text);
		});
	});

	describe('.alloc()', () => {
		it('is a function', () => {
			should(Buffer.alloc).be.a.Function();
		});

		it('with just length', () => {
			const buf = Buffer.alloc(4);
			should(buf.length).eql(4);
			should(buf).eql(Buffer.from([ 0, 0, 0, 0 ]));
		});

		it('with length and fill', () => {
			const buf = Buffer.alloc(4, 'a');
			should(buf.length).eql(4);
			should(buf).eql(Buffer.from([ 0x61, 0x61, 0x61, 0x61 ])); // 0x61 == 97, which is the code for 'a' in ascii
		});

		// TODO: also try with fill and encoding
	});

	describe('.allocUnsafe()', () => {
		it('is a function', () => {
			should(Buffer.allocUnsafe).be.a.Function();
		});

		it('returns Buffer of given length', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.length).eql(4);
		});
	});

	describe('.allocUnsafeSlow()', () => {
		it('is a function', () => {
			should(Buffer.allocUnsafeSlow).be.a.Function();
		});

		it('returns Buffer of given length', () => {
			const buf = Buffer.allocUnsafeSlow(4);
			should(buf.length).eql(4);
		});
	});

	describe('.byteLength()', () => {
		it('is a function', () => {
			should(Buffer.byteLength).be.a.Function();
		});

		it('returns byte length, not string length for utf-8 strings', () => {
			const str = '\u00bd + \u00bc = \u00be';

			should(Buffer.byteLength(str, 'utf8')).eql(12);
		});

		it('returns half the string length for hex encoding', () => {
			should(Buffer.byteLength('abcdef1234', 'hex')).eql(5);
		});

		it('returns correct lengths for base64, dropping padding', () => {
			should(Buffer.byteLength('aGVsbG8gd29ybGQ=', 'base64')).eql(11); // hello world
			should(Buffer.byteLength('aGVsbG8gd29ybGQh', 'base64')).eql(12); // hello world!
			should(Buffer.byteLength('aGVsbG8gd29ybA==', 'base64')).eql(10); // hello worl
		});

		[ 'utf16le', 'ucs-2' ].forEach(encoding => {
			it(`returns double the string length for ${encoding} encoding`, () => {
				should(Buffer.byteLength('abcdef1234', encoding)).eql(20);
			});
		});

		[ 'ascii', 'latin1', 'binary' ].forEach(encoding => {
			it(`returns the string length for ${encoding} encoding`, () => {
				should(Buffer.byteLength('abcdef1234', encoding)).eql(10);
			});
		});
	});

	describe('.compare()', () => {
		it('is a function', () => {
			should(Buffer.compare).be.a.Function();
		});

		it('throws TypeError if first argument is not a Buffer', () => {
			should.throws(() => {
				Buffer.compare(1, 2);
			}, TypeError);
		});
		// Calls buf1.compare(buf2) under the hood
	});

	describe('.concat()', () => {
		it('is a function', () => {
			should(Buffer.concat).be.a.Function();
		});

		it('creates a single Buffer from a list of three instances', () => {
			const buf1 = Buffer.alloc(10);
			const buf2 = Buffer.alloc(14);
			const buf3 = Buffer.alloc(18);

			const totalLength = buf1.length + buf2.length + buf3.length;
			should(totalLength).eql(42);

			const bufA = Buffer.concat([ buf1, buf2, buf3 ]);
			should(bufA.length).eql(totalLength);
		});

		it('creates a single Buffer capped at totalLength from a list of instances', () => {
			// Create a single `Buffer` from a list of three `Buffer` instances.
			const buf1 = Buffer.alloc(10);
			const buf2 = Buffer.alloc(14);
			const buf3 = Buffer.alloc(18);
			const bufA = Buffer.concat([ buf1, buf2, buf3 ], 40); // cap it at 40 bytes!
			should(bufA.length).eql(40);
		});

		it('copies exact bytes from input Buffers, capped at totalLength', () => {
			const buf1 = Buffer.from([ 0xab, 0xcd, 0xef ]);
			const buf2 = Buffer.from([ 0x00, 0x01, 0x02, 0x03 ]);
			const buf3 = Buffer.from([ 0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa, 0xf0 ]);
			const bufA = Buffer.concat([ buf1, buf2, buf3 ], 10); // cap it at 10 bytes!
			should(bufA.length).eql(10);
			should(bufA).eql(Buffer.from([ 0xab, 0xcd, 0xef, 0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd ]));
		});
	});

	describe('.isBuffer()', () => {
		it('is a function', () => {
			should(Buffer.isBuffer).be.a.Function();
		});

		it('returns true for a Buffer', () => {
			should(Buffer.isBuffer(Buffer.from([ 0 ]))).be.true();
		});

		// TODO: What about Ti.Buffer?

		[ null, undefined, 0, -0, 1, -1, NaN, Infinity, {}, [], 'string' ].forEach(value => {
			it(`returns false for ${value}`, () => {
				should(Buffer.isBuffer(value)).eql(false);
			});
		});
	});

	describe('.isEncoding()', () => {
		it('is a function', () => {
			should(Buffer.isEncoding).be.a.Function();
		});

		// utf8, ucs2, ascii, latin1, utf16le
		encodings
			.reduce((es, e) => es.concat(e, e.toUpperCase()), [])
			.forEach(encoding => {
				it(`returns true for '${encoding}'`, () => {
					should(Buffer.isEncoding(encoding)).be.true();
				});
			});

		// invalid encodings/values
		[ 'madeup', true, false, 0, 1, -1, false, Infinity, null, undefined, {}, [] ]
			.forEach(encoding => {
				it(`returns false for ${encoding}`, () => {
					should(Buffer.isEncoding(encoding)).eql(false);
				});
			});
	});

	it('supports array index access', () => {
		const buf = Buffer.alloc(4);
		should(buf.length).eql(4);
		should(buf).eql(Buffer.from([ 0, 0, 0, 0 ]));
		const values = [ 0, 1, 2, 3 ];
		for (let i = 0; i < values.length; i++) {
			buf[i] = values[i];
			should(buf[i]).eql(values[i]);
		}
		should(buf).eql(Buffer.from(values));
	});

	it('.poolSize', () => {
		should(Buffer).have.a.property('poolSize').eql(8192);
	});

	describe('#toString()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.toString).be.a.Function();
		});

		it('supports a range', () => {
			const buf = Buffer.from('tést');
			should(buf.toString('utf8', 0, 3)).eql('té');
		});
	});

	describe('creates and outputs same value for known encodings', () => {
		encodings
			.reduce((es, e) => es.concat(e, e.toUpperCase()), [])
			.forEach(encoding => {
				it(encoding, () => {
					should(Buffer.from('foo', encoding).toString(encoding)).eql('foo');
				});
			});
	});

	describe('utf8', () => {
		it('handles 4-byte utf-8 characters', () => {
			// What do we want to do here? confirm that it can take in emoji chars in a string as utf8 encoding and...
			should(Buffer.from('😀').toString()).eql('😀'); // retains emoji through the conversion
			should(Buffer.from('😀')).eql(Buffer.from([ 0xF0, 0x9F, 0x98, 0x80 ])); // ends up storing these bytes
			should(Buffer.from('😀').toString('hex')).eql('f09f9880'); // can convert to hex
			should(Buffer.from('f09f9880', 'hex').toString('utf-8')).eql('😀'); // can convert the raw hex bytes into the emoji character
		});
	});

	describe('utf-16le', () => {
		it('handles 2-byte utf-16 characters', () => {
			// What do we want to do here? confirm that it can take in emoji chars in a string as utf8 encoding and...
			should(Buffer.from('€', 'utf16le').toString('utf16le')).eql('€'); // retains euro symbol through the conversion
			should(Buffer.from('€', 'utf16le')).eql(Buffer.from([ 0xAC, 0x20 ])); // ends up storing these bytes
			should(Buffer.from('€', 'utf16le').toString('hex')).eql('ac20'); // can convert to hex
			should(Buffer.from('ac20', 'hex').toString('utf16le')).eql('€'); // can convert the raw hex bytes into the euro character
		});

		it('handles 4-byte utf-16 characters', () => {
			should(Buffer.from('𐐷', 'utf16le').toString('utf16le')).eql('𐐷'); // retains euro symbol through the conversion
			should(Buffer.from('𐐷', 'utf16le')).eql(Buffer.from([ 0x01, 0xD8, 0x37, 0xDC ])); // ends up storing these bytes
			should(Buffer.from('𐐷', 'utf16le').toString('hex')).eql('01d837dc'); // can convert to hex
			const result = Buffer.from('01d837dc', 'hex').toString('utf16le');
			should(result).eql('𐐷'); // can convert the raw hex bytes into the original character
			should(result).eql('\ud801\udc37'); // check against the "hex code units" equivalent string
			should(result.length).eql(2); // we get an expected length of 2 (whereas converting to utf-8 we'd get a length of 4)
			// despite being 1 visible character, it's 2 "code points"
			should(result.codePointAt(0)).eql(66615);
			should(result.codePointAt(1)).eql(56375);
		});
	});

	it('handles base64', () => {
		[ 'base64', 'BASE64' ].forEach(encoding => {
			should(Buffer.from('Zm9v', encoding).toString(encoding)).eql('Zm9v');
		});
	});

	describe('hex', () => {
		it('handles .from() and #toString() retaining same value', () => {
			[ 'hex', 'HEX' ].forEach(encoding => {
				should(Buffer.from('666f6f', encoding).toString(encoding)).eql('666f6f');
			});
		});

		it('handles #toString() output from an input utf-8 buffer', () => {
			const buf = Buffer.from('tést');
			should(buf.toString('hex')).eql('74c3a97374');
		});

		it('drops bad hex', () => {
			const buf = Buffer.alloc(4);
			should(buf.length).eql(4);
			should(buf).eql(Buffer.from([ 0, 0, 0, 0 ]));
			should(buf.write('abcdxx', 0, 'hex')).eql(2);
			should(buf).eql(Buffer.from([ 0xab, 0xcd, 0x00, 0x00 ]));
			should(buf.toString('hex')).eql('abcd0000');
			should(buf.write('abcdef01', 0, 'hex')).eql(4);
			should(buf).eql(Buffer.from([ 0xab, 0xcd, 0xef, 0x01 ]));
			should(buf.toString('hex')).eql('abcdef01');

			const copy = Buffer.from(buf.toString('hex'), 'hex');
			should(buf.toString('hex')).eql(copy.toString('hex'));
		});
		// TODO: Test some bad hex!
	});

	describe('ascii', () => {
		it('masks off high bits', () => {
			should(Buffer.from('hérité').toString('ascii')).eql('hC)ritC)');
		});

		it('ignores multi-byte sequences', () => {
			// 71 characters, 78 bytes. The ’ character is a triple-byte sequence.
			const input = 'C’est, graphiquement, la réunion d’un accent aigu '
			+ 'et d’un accent grave.';

			const expected = 'Cb\u0000\u0019est, graphiquement, la rC)union '
				+ 'db\u0000\u0019un accent aigu et db\u0000\u0019un '
				+ 'accent grave.';

			const buf = Buffer.from(input);

			for (let i = 0; i < expected.length; ++i) {
				should(buf.slice(i).toString('ascii')).eql(expected.slice(i));

				// Skip remainder of multi-byte sequence.
				if (input.charCodeAt(i) > 65535) {
					++i;
				}
				if (input.charCodeAt(i) > 127) {
					++i;
				}
			}
		});
	});

	describe('#compare()', () => {
		it('is a function', () => {
			const buf = Buffer.from('ABC');
			should(buf.compare).be.a.Function();
		});

		it('returns 0 for same Buffer', () => {
			const buf1 = Buffer.from('ABC');
			should(buf1.compare(buf1)).eql(0);
		});

		it('returns -1 for target that should come after source', () => {
			const buf1 = Buffer.from('ABC');
			const buf2 = Buffer.from('BCD');
			should(buf1.compare(buf2)).eql(-1);
		});

		it('returns -1 for target that should come after source due to extra length', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should(buf1.compare(buf3)).eql(-1);
		});

		it('returns 1 for target that should come before source', () => {
			const buf1 = Buffer.from('ABC');
			const buf2 = Buffer.from('BCD');
			should(buf2.compare(buf1)).eql(1);
		});

		it('returns 1 for target that should come before source due to extra length', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should(buf3.compare(buf1)).eql(1);
		});

		it('throws if targetStart < 0', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should.throws(() => {
				buf3.compare(buf1, -1);
			}, RangeError);
		});

		it('throws if sourceStart < 0', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should.throws(() => {
				buf3.compare(buf1, 0, buf1.length, -1);
			}, RangeError);
		});

		it('throws if targetEnd > target.byteLength', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should.throws(() => {
				buf3.compare(buf1, 0, buf1.length + 3);
			}, RangeError);
		});

		it('throws if sourceEnd > source.byteLength', () => {
			const buf1 = Buffer.from('ABC');
			const buf3 = Buffer.from('ABCD');
			should.throws(() => {
				buf3.compare(buf1, 0, buf1.length, 0, buf3.length + 3);
			}, RangeError);
		});

		it('throws TypeError if argument is not a Buffer', () => {
			should.throws(() => {
				const buf1 = Buffer.from('ABC');
				buf1.compare(1);
			}, TypeError);
		});

		// TODO: Sort using Buffer.compare and check we sorted in expected order!
	});

	describe('#copy()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.copy).be.a.Function();
		});

		it('copies range of bytes from one Buffer to another', () => {
			const buf1 = Buffer.allocUnsafe(26);
			const buf2 = Buffer.allocUnsafe(26).fill('!');

			for (let i = 0; i < 26; i++) {
				// 97 is the decimal ASCII value for 'a'.
				buf1[i] = i + 97;
			}

			// Copy `buf1` bytes 16 through 19 into `buf2` starting at byte 8 of `buf2`.
			buf1.copy(buf2, 8, 16, 20);

			should(buf2.toString('ascii', 0, 25)).eql('!!!!!!!!qrst!!!!!!!!!!!!!');
		});

		it('copies Buffer to another, stopping at end of target', () => {
			const buf1 = Buffer.from([ 0x00, 0x01, 0x02, 0x03 ]);
			const buf2 = Buffer.allocUnsafe(10).fill('!');

			// Copy `buf1` bytes into `buf2` starting at byte 8 of `buf2`.
			buf1.copy(buf2, 8);

			should(buf2.toString('ascii')).eql('!!!!!!!!\u0000\u0001');
		});
	});

	describe('#entries()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.entries).be.a.Function();
		});

		it('returns an Iterator holding an array of index to value', () => {
			const buf = Buffer.from('buffer');
			const entries = [];
			for (const entry of buf.entries()) {
				entries.push(entry);
			}
			should(entries).eql([ [ 0, 98 ], [ 1, 117 ], [ 2, 102 ], [ 3, 102 ], [ 4, 101 ], [ 5, 114 ] ]);
		});

		it('values returned correctly on sliced Buffer', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(3);
			const entries = [];
			for (const entry of slice.entries()) {
				entries.push(entry);
			}
			should(entries).eql([ [ 0, 102 ], [ 1, 101 ], [ 2, 114 ] ]);
		});
	});

	describe('#equals()', () => {
		it('is a function', () => {
			const buf = Buffer.allocUnsafe(1);
			should(buf.equals).be.a.Function();
		});

		it('returns true for same Buffer object', () => {
			const buf1 = Buffer.from('ABC');
			should(buf1.equals(buf1)).be.true();
		});

		it('returns true for equivalent Buffer', () => {
			const buf1 = Buffer.from('ABC');
			const buf2 = Buffer.from([ 0x41, 0x42, 0x43 ]); // ascii for ABC
			should(buf1.equals(buf2)).be.true();
		});

		it('returns false for Buffers having different contents', () => {
			const buf1 = Buffer.from('ABC');
			const buf2 = Buffer.from('BCD');
			should(buf1.equals(buf2)).eql(false);
		});

		it('throws if argument is not a Buffer', () => {
			const buf = Buffer.from('ABC');
			should.throws(() => {
				buf.equals(null);
			}, TypeError);
		});
	});

	describe('#fill()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.fill).be.a.Function();
		});

		it('handles simple ascii character fill', () => {
			const b = Buffer.allocUnsafe(50).fill('h');
			should(b.toString()).eql('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');
		});

		it('handles 2-byte utf-8 character fill', () => {
			const b = Buffer.allocUnsafe(3).fill('\u0222');
			should(b[0]).eql(0xc8);
			should(b[1]).eql(0xa2);
			should(b[2]).eql(0xc8);
		});

		it('truncates invalid fill data', () => {
			const b = Buffer.allocUnsafe(5).fill('aazz', 'hex');
			should(b[0]).eql(0xaa);
			should(b[1]).eql(0xaa);
			should(b[2]).eql(0xaa);
			should(b[3]).eql(0xaa);
			should(b[4]).eql(0xaa);
		});

		it('throws if no valid fill data', () => {
			should.throws(() => {
				Buffer.allocUnsafe(5).fill('zz', 'hex');
			},
			Error);
		});
	});

	describe('#indexOf()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.indexOf).be.a.Function();
		});

		it('finds a string with no specified encoding', () => {
			const buf = Buffer.from('this is a buffer');
			should(buf.indexOf('this')).eql(0);
			should(buf.indexOf('is')).eql(2);
		});

		it('finds a Buffer with no specified encoding', () => {
			const buf = Buffer.from('this is a buffer');
			should(buf.indexOf(Buffer.from('a buffer'))).eql(8);
		});

		it('finds a Number with no specified encoding', () => {
			const buf = Buffer.from('this is a buffer');
			should(buf.indexOf(97)).eql(8); // 97 is ascii for 'a'
		});

		it('returns -1 for Buffer not found', () => {
			const buf = Buffer.from('this is a buffer');
			should(buf.indexOf(Buffer.from('a buffer example'))).eql(-1);
		});

		it('finds a Buffer slice', () => {
			const buf = Buffer.from('this is a buffer');
			should(buf.indexOf(Buffer.from('a buffer example').slice(0, 8))).eql(8);
		});

		it('finds a string with utf16le encoding', () => {
			const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');
			should(utf16Buffer.indexOf('\u03a3', 0, 'utf16le')).eql(4);
		});

		it('finds a string with utf16le encoding from a negative offset', () => {
			const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');
			should(utf16Buffer.indexOf('\u03a3', -4, 'utf16le')).eql(6);
		});
	});

	describe('#includes()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.includes).be.a.Function();
		});

		// TODO: search for a number, Buffer and string!
	});

	describe('#keys()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.keys).be.a.Function();
		});

		it('returns an Iterator holding indices', () => {
			const buf = Buffer.from('buffer');
			const keys = [];
			for (const key of buf.keys()) {
				keys.push(key);
			}
			should(keys).eql([ 0, 1, 2, 3, 4, 5 ]);
		});

		it('indices start at 0, even on slices with a byteOffset', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(3);
			const keys = [];
			for (const key of slice.keys()) {
				keys.push(key);
			}
			should(keys).eql([ 0, 1, 2 ]);
		});
	});

	describe('#readDoubleBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readDoubleBE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
			should(buf.readDoubleBE(0)).eql(8.20788039913184e-304);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
			should.throws(() => {
				buf.readDoubleBE(1);
			}, RangeError);
		});
	});

	describe('#readDoubleLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readDoubleLE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
			should(buf.readDoubleLE(0)).eql(5.447603722011605e-270);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, 2, 3, 4, 5, 6, 7, 8 ]);
			should.throws(() => {
				buf.readDoubleLE(1);
			}, RangeError);
		});
	});

	describe('#readFloatBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readFloatBE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, 2, 3, 4 ]);
			should(buf.readFloatBE(0)).eql(2.387939260590663e-38);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, 2, 3, 4 ]);
			should.throws(() => {
				buf.readFloatBE(1);
			}, RangeError);
		});
	});

	describe('#readFloatLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readFloatLE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, 2, 3, 4 ]);
			should(buf.readFloatLE(0)).eql(1.539989614439558e-36);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, 2, 3, 4 ]);
			should.throws(() => {
				buf.readFloatLE(1);
			}, RangeError);
		});
	});

	describe('#readInt8()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readInt8).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should(buf.readInt8(0)).eql(1);
		});

		it('returns signed value', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should(buf.readInt8(1)).eql(-2);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.readInt8(2);
			}, RangeError);
		});
	});

	describe('#readInt16BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readInt16BE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0, 5 ]);
			should(buf.readInt16BE(0)).eql(5);
		});

		it('returns signed value', () => {
			const buf = Buffer.from([ 0x87, 0xD0 ]);
			should(buf.readInt16BE(0)).eql(-30768);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.readInt16BE(2);
			}, RangeError);
		});
	});

	describe('#readInt16LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readInt16LE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0, 5 ]);
			should(buf.readInt16LE(0)).eql(1280);
		});

		it('returns signed value', () => {
			const buf = Buffer.from([ 0xD0, 0x87 ]);
			should(buf.readInt16LE(0)).eql(-30768);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.readInt16LE(2);
			}, RangeError);
		});
	});

	describe('#readInt32BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readInt32BE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0, 0, 0, 5 ]);
			should(buf.readInt32BE(0)).eql(5);
		});

		it('returns signed value', () => {
			const buf = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFE ]);
			should(buf.readInt32BE(0)).eql(-2);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFE ]);
			should.throws(() => {
				buf.readInt32BE(2);
			}, RangeError);
		});
	});

	describe('#readInt32LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readInt32LE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0, 0, 0, 5 ]);
			should(buf.readInt32LE(0)).eql(83886080);
		});

		it('returns signed value', () => {
			const buf = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFE ]);
			should(buf.readInt32LE(0)).eql(-16777217);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFE ]);
			should.throws(() => {
				buf.readInt32LE(2);
			}, RangeError);
		});
	});

	describe('#readUInt8()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUInt8).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should(buf.readUInt8(0)).eql(1);
		});

		it('returns signed value coerced to unsigned', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should(buf.readUInt8(1)).eql(254);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.readUInt8(2);
			}, RangeError);
		});
	});

	describe('#readUInt16BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUInt16BE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56 ]);
			should(buf.readUInt16BE(0).toString(16)).eql('1234');
			should(buf.readUInt16BE(1).toString(16)).eql('3456');
		});

		it('returns signed value coerced to unsigned', () => {
			const buf = Buffer.from([ 0xFB, 0x2E ]);
			should(buf.readUInt16BE(0)).eql(64302);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56 ]);
			should.throws(() => {
				buf.readUInt16BE(2);
			}, RangeError);
		});
	});

	describe('#readUInt16LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUInt16LE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56 ]);
			should(buf.readUInt16LE(0).toString(16)).eql('3412');
			should(buf.readUInt16LE(1).toString(16)).eql('5634');
		});

		it('returns signed value coerced to unsigned', () => {
			const buf = Buffer.from([ 0x2E, 0xFB ]);
			should(buf.readUInt16LE(0)).eql(64302);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56 ]);
			should.throws(() => {
				buf.readUInt16LE(2);
			}, RangeError);
		});
	});

	describe('#readUInt32BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUInt32BE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]);
			should(buf.readUInt32BE(0).toString(16)).eql('12345678');
		});

		it('returns signed value coerced to unsigned', () => {
			const buf = Buffer.from([ 0xFF, 0x43, 0x9E, 0xB2 ]); // -12345678 signed value
			should(buf.readUInt32BE(0)).eql(4282621618);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]);
			should.throws(() => {
				buf.readUInt32BE(1);
			}, RangeError);
		});
	});

	describe('#readUInt32LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUInt32LE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]);
			should(buf.readUInt32LE(0).toString(16)).eql('78563412');
		});

		it('returns signed value coerced to unsigned', () => {
			const buf = Buffer.from([ 0xB2, 0x9E, 0x43, 0xFF ]); // -12345678 signed value
			should(buf.readUInt32LE(0)).eql(4282621618);
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]);
			should.throws(() => {
				buf.readUInt32LE(1);
			}, RangeError);
		});
	});

	describe('#readUIntBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUIntLE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]);
			should(buf.readUIntBE(0, 6).toString(16)).eql('1234567890ab');
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]);
			should.throws(() => {
				buf.readUIntBE(1, 6);
			}, RangeError);
		});
	});

	describe('#readUIntLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.readUIntLE).be.a.Function();
		});

		it('returns unsigned value', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]);
			should(buf.readUIntLE(0, 6).toString(16)).eql('ab9078563412');
		});

		it('throws when trying to read out of range', () => {
			const buf = Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]);
			should.throws(() => {
				buf.readUIntLE(1, 6);
			}, RangeError);
		});
	});

	describe('#slice()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.slice).be.a.Function();
		});

		it('sliced Buffer holds non-0 byteOffset, correct length', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(3);
			should(slice.byteOffset).eql(3);
			should(slice.length).eql(3);
		});

		it('can accept negative indices', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(-5, -1);
			should(slice.byteOffset).eql(1);
			should(slice.length).eql(4);
			should(slice).eql(Buffer.from('uffe'));
		});

		it('if start is negative and still before beginning, treats like 0', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(-287687);
			should(slice.byteOffset).eql(0);
			should(slice.length).eql(6);
			should(slice).eql(buf);
		});

		it('treats end beyond length as equivalent to specifying length', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(3, 10);
			should(slice.byteOffset).eql(3);
			should(slice.length).eql(3);
			should(slice).eql(Buffer.from('fer'));
		});

		it('returns empty Buffer if end is < start', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(5, 1);
			should(slice.byteOffset).eql(5); // retains byteOffset
			should(slice.length).eql(0);
			should(slice).eql(Buffer.from(''));
		});

		it('slice of a slice adds up byteOffset', () => {
			const buf = Buffer.from('buffer');
			const sliceOfSlice = buf.slice(1).slice(2);
			should(sliceOfSlice.byteOffset).eql(3);
			should(sliceOfSlice.length).eql(3);
			should(sliceOfSlice).eql(Buffer.from('fer'));
		});
	});

	describe('#subarray()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.subarray).be.a.Function();
		});

		it('sliced Buffer holds non-0 byteOffset, correct length', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.subarray(3);
			should(slice.byteOffset).eql(3);
			should(slice.length).eql(3);
		});
	});

	describe('#swap16()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.swap16).be.a.Function();
		});

		it('swaps endianness of each 2-byte pair', () => {
			const buf = Buffer.from([ 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8 ]);
			should(buf.swap16()).eql(Buffer.from([ 0x02, 0x01, 0x04, 0x03, 0x06, 0x05, 0x08, 0x07 ]));
		});

		it('throws if buffer length is not multiple of 2h', () => {
			const buf2 = Buffer.from([ 0x1, 0x2, 0x3 ]);
			should.throws(() => {
				buf2.swap16();
			}, RangeError);
		});
	});

	describe('#swap32()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.swap32).be.a.Function();
		});

		it('swaps endianness of each 4-byte pair', () => {
			const buf = Buffer.from([ 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8 ]);
			should(buf.swap32()).eql(Buffer.from([ 0x04, 0x03, 0x02, 0x01, 0x08, 0x07, 0x06, 0x05 ]));
		});

		it('throws if buffer length is not multiple of 2h', () => {
			const buf2 = Buffer.from([ 0x1, 0x2, 0x3 ]);
			should.throws(() => {
				buf2.swap32();
			}, RangeError);
		});
	});

	describe('#swap64()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.swap64).be.a.Function();
		});

		it('swaps endianness of each 8-byte pair', () => {
			const buf = Buffer.from([ 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8 ]);
			should(buf.swap64()).eql(Buffer.from([ 0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01 ]));
		});

		it('throws if buffer length is not multiple of 2h', () => {
			const buf2 = Buffer.from([ 0x1, 0x2, 0x3 ]);
			should.throws(() => {
				buf2.swap64();
			}, RangeError);
		});
	});

	describe('#toJSON()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.toJSON).be.a.Function();
		});

		it('returns an object with type: "Buffer" and data holding byte array', () => {
			const buf = Buffer.from('buffer');
			should(buf.toJSON()).eql({
				type: 'Buffer',
				data: [ 98, 117, 102, 102, 101, 114 ] // ascii codes for 'buffer'
			});
		});
	});

	describe('#values()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.values).be.a.Function();
		});

		it('returns an Iterator holding indices', () => {
			const buf = Buffer.from('buffer');
			const values = [];
			for (const value of buf.values()) {
				values.push(value);
			}
			should(values).eql([ 98, 117, 102, 102, 101, 114 ]);
		});

		it('values returned correctly on sliced Buffer', () => {
			const buf = Buffer.from('buffer');
			const slice = buf.slice(3);
			const values = [];
			for (const value of slice.values()) {
				values.push(value);
			}
			should(values).eql([ 102, 101, 114 ]);
		});

		it('is called automatically when a Buffer is used in a for..of statement', () => {
			const buf = Buffer.from('buffer');
			const values = [];
			for (const value of buf) {
				values.push(value);
			}
			should(values).eql([ 98, 117, 102, 102, 101, 114 ]);
		});
	});

	describe('#writeDoubleBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeDoubleBE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(8);
			should(buf.writeDoubleBE(123.456, 0)).eql(8);
			should(buf).eql(Buffer.from([ 0x40, 0x5e, 0xdd, 0x2f, 0x1a, 0x9f, 0xbe, 0x77 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(8);
			should.throws(() => {
				buf.writeDoubleBE(123.456, 2);
			}, RangeError);
		});
	});

	describe('#writeDoubleLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeDoubleLE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(8);
			should(buf.writeDoubleLE(123.456, 0)).eql(8);
			should(buf).eql(Buffer.from([ 0x77, 0xbe, 0x9f, 0x1a, 0x2f, 0xdd, 0x5e, 0x40 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(8);
			should.throws(() => {
				buf.writeDoubleLE(123.456, 2);
			}, RangeError);
		});
	});

	describe('#writeFloatBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeFloatBE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeFloatBE(0xcafebabe, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0x4f, 0x4a, 0xfe, 0xbb ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeFloatBE(123.456, 2);
			}, RangeError);
		});
	});

	describe('#writeFloatLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeFloatLE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeFloatLE(0xcafebabe, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0xbb, 0xfe, 0x4a, 0x4f ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeFloatLE(123.456, 2);
			}, RangeError);
		});
	});

	describe('#writeInt8()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeInt8).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(2);
			should(buf.writeInt8(2, 0)).eql(1);
			should(buf.writeInt8(-2, 1)).eql(2);
			should(buf).eql(Buffer.from([ 0x02, 0xfe ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(1);
			should.throws(() => {
				buf.writeInt8(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(1);
			should.throws(() => {
				buf.writeInt8(-23563, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeInt8(2452353, 0);
			}, RangeError);
		});
	});

	describe('#writeInt16BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeInt16BE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeInt16BE(0x0102, 0)).eql(2);
			should(buf.writeInt16BE(0x0304, 2)).eql(4);
			should(buf).eql(Buffer.from([ 0x01, 0x02, 0x03, 0x04 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeInt16BE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeInt16BE(-32769, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeInt16BE(32768, 0);
			}, RangeError);
		});
	});

	describe('#writeInt16LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeInt16LE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeInt16LE(0x0102, 0)).eql(2);
			should(buf.writeInt16LE(0x0304, 2)).eql(4);
			should(buf).eql(Buffer.from([ 0x02, 0x01, 0x04, 0x03 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeInt16LE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(2);
			should.throws(() => {
				buf.writeInt16LE(-32769, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeInt16LE(32768, 0);
			}, RangeError);
		});
	});

	describe('#writeInt32BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeInt32BE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeInt32BE(0x01020304, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0x01, 0x02, 0x03, 0x04 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeInt32BE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeInt32BE(-2147483649, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeInt32BE(2147483648, 0);
			}, RangeError);
		});
	});

	describe('#writeInt32LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeInt32LE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeInt32LE(0x05060708, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0x08, 0x07, 0x06, 0x05 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeInt32LE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeInt32LE(-2147483649, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeInt32LE(2147483648, 0);
			}, RangeError);
		});
	});

	describe('#writeIntBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeIntBE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(6);
			should(buf.writeIntBE(0x1234567890ab, 0, 6)).eql(6);
			should(buf).eql(Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]));
		});

		it('handles negative value', () => {
			const buf = Buffer.allocUnsafe(1);
			should(buf.writeIntBE(-2, 0, 1)).eql(1);
			should(buf).eql(Buffer.from([ 0xfe ]));
		});

		it('handles negative multi-byte value', () => {
			const buf = Buffer.allocUnsafe(2);
			should(buf.writeIntBE(-2, 0, 2)).eql(2);
			should(buf).eql(Buffer.from([ 0xff, 0xfe ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeIntBE(0x1234567890ab, 1, 6);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeIntBE(-258, 0, 1);
			}, RangeError);
			should.throws(() => {
				buf.writeIntBE(2147483648, 0, 4);
			}, RangeError);
		});
	});

	describe('#writeIntLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeIntLE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(6);
			should(buf.writeIntLE(0x1234567890ab, 0, 6)).eql(6);
			should(buf).eql(Buffer.from([ 0xab, 0x90, 0x78, 0x56, 0x34, 0x12 ]));
		});

		it('handles negative value', () => {
			const buf = Buffer.allocUnsafe(1);
			should(buf.writeIntLE(-2, 0, 1)).eql(1);
			should(buf).eql(Buffer.from([ 0xfe ]));
		});

		it('handles negative multi-byte value', () => {
			const buf = Buffer.allocUnsafe(2);
			should(buf.writeIntLE(-2, 0, 2)).eql(2);
			should(buf).eql(Buffer.from([ 0xfe, 0xff ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(6);
			should.throws(() => {
				buf.writeIntLE(0x1234567890ab, 1, 6);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.allocUnsafe(4);
			should.throws(() => {
				buf.writeIntLE(-258, 0, 1);
			}, RangeError);
			should.throws(() => {
				buf.writeIntLE(2147483648, 0, 4);
			}, RangeError);
		});
	});

	describe('#writeUInt8()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUInt8).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeUInt8(0x3, 0)).eql(1);
			should(buf.writeUInt8(0x4, 1)).eql(2);
			should(buf.writeUInt8(0x23, 2)).eql(3);
			should(buf.writeUInt8(0x42, 3)).eql(4);
			should(buf).eql(Buffer.from([ 0x3, 0x4, 0x23, 0x42 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUInt8(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeUInt8(-23, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeUInt8(2452353, 0);
			}, RangeError);
		});
	});

	describe('#writeUInt16BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUInt16BE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeUInt16BE(0xdead, 0)).eql(2);
			should(buf.writeUInt16BE(0xbeef, 2)).eql(4);
			should(buf).eql(Buffer.from([ 0xde, 0xad, 0xbe, 0xef ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUInt16BE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeUInt16BE(-234, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeUInt16BE(65536, 0);
			}, RangeError);
		});
	});

	describe('#writeUInt16LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUInt16LE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeUInt16LE(0xdead, 0)).eql(2);
			should(buf.writeUInt16LE(0xbeef, 2)).eql(4);
			should(buf).eql(Buffer.from([ 0xad, 0xde, 0xef, 0xbe ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUInt16LE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeUInt16LE(-25243, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeUInt16LE(65536, 0);
			}, RangeError);
		});
	});

	describe('#writeUInt32BE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUInt32BE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeUInt32BE(0xfeedface, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0xfe, 0xed, 0xfa, 0xce ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUInt32BE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeUInt32BE(-3, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeUInt32BE(4294967297, 0);
			}, RangeError);
		});
	});

	describe('#writeUInt32LE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUInt32LE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(4);
			should(buf.writeUInt32LE(0xfeedface, 0)).eql(4);
			should(buf).eql(Buffer.from([ 0xce, 0xfa, 0xed, 0xfe ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUInt32LE(2, 2);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.from([ 1, 2 ]);
			should.throws(() => {
				buf.writeUInt32LE(-2, 0);
			}, RangeError);
			should.throws(() => {
				buf.writeUInt32LE(4294967296, 0);
			}, RangeError);
		});
	});

	describe('#writeUIntBE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUIntBE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(6);
			should(buf.writeUIntBE(0x1234567890ab, 0, 6)).eql(6);
			should(buf).eql(Buffer.from([ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.from([ 1, -2 ]);
			should.throws(() => {
				buf.writeUIntBE(0x1234567890ab, 1, 6);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.alloc(6);
			// check past end of each allowed value range
			// TODO: Also check any negative number for each byte length
			should.throws(() => {
				buf.writeUIntBE(256, 0, 1);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntBE(65536, 0, 2);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntBE(16777216, 0, 3);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntBE(4294967296, 0, 4);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntBE(1099511627776, 0, 5);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntBE(72057594037927941, 0, 6);
			}, RangeError);
		});
	});

	describe('#writeUIntLE()', () => {
		it('is a function', () => {
			const buf = Buffer.from('test');
			should(buf.writeUIntLE).be.a.Function();
		});

		it('handles good value and offset', () => {
			const buf = Buffer.allocUnsafe(6);
			should(buf.writeUIntLE(0x1234567890ab, 0, 6)).eql(6);
			should(buf).eql(Buffer.from([ 0xab, 0x90, 0x78, 0x56, 0x34, 0x12 ]));
		});

		it('throws when trying to write offset out of range', () => {
			const buf = Buffer.allocUnsafe(6);
			should.throws(() => {
				buf.writeUIntLE(0x1234567890ab, 1, 6);
			}, RangeError);
		});

		it('throws when trying to write values out of range', () => {
			const buf = Buffer.alloc(6);
			// check past end of each allowed value range
			// TODO: Also check any negative number for each byte length
			should.throws(() => {
				buf.writeUIntLE(256, 0, 1);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntLE(65536, 0, 2);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntLE(16777216, 0, 3);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntLE(4294967296, 0, 4);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntLE(1099511627776, 0, 5);
			}, RangeError);
			should.throws(() => {
				buf.writeUIntLE(72057594037927941, 0, 6);
			}, RangeError);
		});
	});

	it('#concat() sliced Buffer', () => {
		const buf = Buffer.from('buffer');
		const slice = buf.slice(1, -2); // return a slice pointing at 'uff' portion
		const concatd = Buffer.concat([ slice ]); // now concat that into a new copy (uses #copy() under the hood)
		should(concatd.equals(Buffer.from('uff'))).be.true(); // the new concat/copy should be 'uff'
	});

	it('passes ArrayBuffer.isView() sniff test', () => {
		const buf = Buffer.from(Ti.createBuffer({ length: 5 }));
		should(ArrayBuffer.isView(buf)).be.true();
	});

	it('passes constructor.BYTES_PER_ELEMENT === 1 sniff test', () => {
		const buf = Buffer.from(Ti.createBuffer({ length: 5 }));
		should(buf.constructor).have.property('BYTES_PER_ELEMENT').which.is.equal(1);
	});

	it('.buffer property', () => {
		const buf = Buffer.from([ 0xFF, 0xAB, 0x80 ]);
		const arrayBuffer = buf.buffer;
		should.exist(arrayBuffer);
		should(ArrayBuffer.isView(buf.buffer)).be.false(); // true for Buffer, false for ArrayBuffer itself
		should(arrayBuffer).have.property('byteLength').which.equals(3);
	});

	describe('#set()', () => {
		it('is a Function', () => {
			const buf = Buffer.from([ 0xFF, 0xAB, 0x80 ]);
			should(buf).have.property('set').which.is.a.Function();
		});

		it('with array argument', () => {
			const buf = Buffer.from([ 0xFF, 0xAB, 0x80 ]);
			buf.set([ 1, 2, 3 ]);
			should(buf.equals(Buffer.from([ 1, 2, 3 ]))).be.true();
		});

		it('with array argument, offset', () => {
			const buf = Buffer.from([ 0xFF, 0xAB, 0x80 ]);
			buf.set([ 1, 2 ], 1);
			should(buf.equals(Buffer.from([ 0xFF, 1, 2 ]))).be.true();
		});

		it('with bad offset throws Error', () => {
			const buf = Buffer.from([ 0xFF, 0xAB, 0x80 ]);
			(() => buf.set([ 1, 2 ], 3)).should.throw();
		});

		// TODO: set with Typed Array
		// TODO: set with another Buffer
	});
});
