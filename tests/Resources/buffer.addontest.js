/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('buffer', () => {
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
