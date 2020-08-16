/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-deprecated-api: "off"  */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
let stream;

describe('stream', function () {
	it('should be required as core module', function () {
		stream = require('stream');
		stream.should.be.a.Function(); // it's a constructor
	});

	describe('.Readable', () => {
		it('is a function', () => {
			stream.Readable.should.be.a.Function(); // constructor
		});
	});

	describe('.Writable', () => {
		it('is a function', () => {
			stream.Writable.should.be.a.Function(); // constructor
		});
	});

	describe('.Duplex', () => {
		it('is a function', () => {
			stream.Duplex.should.be.a.Function(); // constructor
		});
	});

	// TODO: Add PassThrough!
	describe.allBroken('.PassThrough', () => {
		it('is a function', () => {
			stream.PassThrough.should.be.a.Function(); // constructor
		});
	});

	describe('.Transform', () => {
		it('is a function', () => {
			stream.Transform.should.be.a.Function(); // constructor
		});
	});

	describe('.Stream', () => {
		it('is a function', () => {
			stream.Stream.should.be.a.Function(); // constructor
			stream.Stream.should.eql(stream); // alias to module root object
		});
	});
});
