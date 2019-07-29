/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
let StringDecoder;

describe('string_decoder', () => {
	it('can be loaded as a core module', () => {
		StringDecoder = require('string_decoder').StringDecoder;
		should(StringDecoder).exist;
	});

	it('uses \'utf8\' as the default encoding', () => {
		const decoder = new StringDecoder();
		should(decoder.encoding).eql('utf8');
	});

	describe('#end()', () => {
		it('is a Function', () => {
			const decoder = new StringDecoder();
			should(decoder.end).be.a.Function;
		});

		it('handles base64 with single byte', () => {
			const decoder = new StringDecoder('base64');
			should(decoder.write(Buffer.from([ 0x61 ]))).eql('');
			should(decoder.end()).eql('YQ==');
			// resets internals so writing empty buffer doesn't output anything anymore
			should(decoder.write(Buffer.from([]))).eql('');
			should(decoder.end()).eql('');
			// now writing an empty buffer doesn't append anything!
			// testEnd('base64', Buffer.of(0x61), Buffer.of(), 'YQ==');
			// testEnd('base64', Buffer.of(0x61), Buffer.of(0x61), 'YQ==YQ==');
			// testEnd('base64', Buffer.of(0x61, 0x61), Buffer.of(), 'YWE=');
			// testEnd('base64', Buffer.of(0x61, 0x61), Buffer.of(0x61), 'YWE=YQ==');
			// testEnd('base64', Buffer.of(0x61, 0x61, 0x61), Buffer.of(), 'YWFh');
			// testEnd('base64', Buffer.of(0x61, 0x61, 0x61), Buffer.of(0x61), 'YWFhYQ==');
		});

		it('handles base64 with two bytes', () => {
			const decoder = new StringDecoder('base64');
			should(decoder.write(Buffer.from([ 0x61, 0x61 ]))).eql('');
			should(decoder.end()).eql('YWE=');
			// resets internals so writing empty buffer doesn't output anything anymore
			should(decoder.write(Buffer.from([]))).eql('');
			should(decoder.end()).eql('');
		});

		it('handles base64 with three bytes', () => {
			const decoder = new StringDecoder('base64');
			should(decoder.write(Buffer.from([ 0x61, 0x61, 0x61 ]))).eql('YWFh'); // we got our 3 bytes!
			should(decoder.end()).eql(''); // don't add anything else
			// resets internals so writing empty buffer doesn't output anything anymore
			should(decoder.write(Buffer.from([]))).eql('');
			should(decoder.end()).eql('');
		});
	});

	describe('#write()', () => {
		it('is a Function', () => {
			const decoder = new StringDecoder();
			should(decoder.write).be.a.Function;
		});

		it('holds multi-byte utf-8 characters until end is reached', () => {
			const decoder = new StringDecoder('utf8');
			should(decoder.write(Buffer.from([ 0xE2 ]))).eql('');
			should(decoder.write(Buffer.from([ 0x82 ]))).eql('');
			should(decoder.end(Buffer.from([ 0xAC ]))).eql('€'); // FIXME: Failing!
		});
	});

	// FIXME: I'm using ES6 classes which doesn't allow non-new constructor!
	it('works without new keyword', () => {
		const decoder2 = {};
		StringDecoder.call(decoder2);
		should(decoder2.encoding).eql('utf8');
		should(decoder2.write).be.a.Function;
		should(decoder2.end).be.a.Function;
	});

	it('handles standard utf-8 buffers', () => {
		decodeTest('utf8', Buffer.from('$', 'utf8'), '$');
		decodeTest('utf-8', Buffer.from('¢', 'utf-8'), '¢');
		decodeTest('utf-8', Buffer.from('€', 'utf-8'), '€');
		decodeTest('utf-8', Buffer.from('𤭢', 'utf-8'), '𤭢');
	});

	it('handles mixed ascii and non-ascii', () => {
		decodeTest(
			'utf-8',
			Buffer.from([ 0xCB, 0xA4, 0x64, 0xE1, 0x8B, 0xA4, 0x30, 0xE3, 0x81, 0x85 ]),
			'\u02e4\u0064\u12e4\u0030\u3045'
		);
	});

	it.allBroken('handles invalid utf-8 input', () => {
		decodeTest('utf-8', Buffer.from('C9B5A941', 'hex'), '\u0275\ufffdA');
		decodeTest('utf-8', Buffer.from('E2', 'hex'), '\ufffd');
		decodeTest('utf-8', Buffer.from('E241', 'hex'), '\ufffdA'); // FIXME: Failing!
		decodeTest('utf-8', Buffer.from('CCCCB8', 'hex'), '\ufffd\u0338');
		decodeTest('utf-8', Buffer.from('F0B841', 'hex'), '\ufffdA');
		decodeTest('utf-8', Buffer.from('F1CCB8', 'hex'), '\ufffd\u0338');
		decodeTest('utf-8', Buffer.from('F0FB00', 'hex'), '\ufffd\ufffd\0');
		decodeTest('utf-8', Buffer.from('CCE2B8B8', 'hex'), '\ufffd\u2e38');
		decodeTest('utf-8', Buffer.from('E2B8CCB8', 'hex'), '\ufffd\u0338');
		decodeTest('utf-8', Buffer.from('E2FBCC01', 'hex'), '\ufffd\ufffd\ufffd\u0001');
		decodeTest('utf-8', Buffer.from('CCB8CDB9', 'hex'), '\u0338\u0379');
	});

	// UCS-2
	it('handles UCS-2', () => {
		decodeTest('ucs2', Buffer.from('ababc', 'ucs2'), 'ababc');
	});

	// UTF-16LE
	it('handles UTF-16LE', () => {
		decodeTest('utf16le', Buffer.from('3DD84DDC', 'hex'), '\ud83d\udc4d'); // thumbs up
	});
});

function decodeTest(encoding, input, expected) {
	const decoder = new StringDecoder(encoding);
	let output = '';
	output += decoder.write(input);
	output += decoder.end();
	should(output).eql(expected);
}
