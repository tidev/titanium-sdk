/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('timers', () => {
	describe('#setImmediate()', () => {
		it('is a function', () => {
			should(global.setImmediate).be.a.Function;
		});

		it('accepts callback', finish => {
			setImmediate(() => finish());
		});

		it('accepts callback and arguments', finish => {
			setImmediate((one, two, three) => {
				try {
					one.should.eql(1);
					two.should.eql('2');
					three.should.eql([ 3 ]);
					finish();
				} catch (e) {
					finish(e);
				}
			}, 1, '2', [ 3 ]);
		});

		it('if callback is not a function TypeError is thrown', () => {
			should.throws(() => {
				setImmediate(1, '2', [ 3 ]);
			}, TypeError);
		});
	});

	describe('#clearImmediate()', () => {
		it('is a function', () => {
			should(global.clearImmediate).be.a.Function;
		});

		it('clears immediate created with #setImmediate()', finish => {
			const immediate = setImmediate(() => {
				finish(new Error('setImmediate should have never fired!'));
			});
			clearImmediate(immediate);
			setTimeout(() => {
				finish();
			}, 20);
		});
	});

	describe('#setTimeout', () => {
		it.allBroken('if callback is not a function TypeError is thrown', () => {
			should.throws(() => {
				setTimeout(1, 100);
			}, TypeError);
		});
	});

	describe('#setInterval', () => {
		it.allBroken('if callback is not a function TypeError is thrown', () => {
			should.throws(() => {
				setInterval(1, 100);
			}, TypeError);
		});
	});
});
