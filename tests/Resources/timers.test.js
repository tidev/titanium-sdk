/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env node, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Timers', function () {
	describe('#setTimeout', function () {
		it('is a function', function () {
			should(setTimeout).be.a.Function();
		});

		it('accepts callback and interval', function (finish) {
			setTimeout(function () {
				finish();
			}, 1);
		});

		it('accepts callback and no specified interval', function (finish) {
			setTimeout(function () {
				finish();
			});
		});

		it.windowsBroken('accepts callback and negative interval, still fires', function (finish) {
			setTimeout(function () {
				finish();
			}, -1);
		});

		it.windowsBroken('accepts callback, interval, and additional arguments', function (finish) {
			setTimeout(function (argOne, argTwo, argThree) {
				try {
					argOne.should.eql(2);
					argTwo.should.eql('3');
					argThree.should.be.an.Object();
					argThree.should.have.a.property('name').which.eql('four');
					finish();
				} catch (err) {
					finish(err);
				}
			}, 1, 2, '3', { name: 'four' });
		});

		it.allBroken('if callback is not a function TypeError is thrown', () => {
			should.throws(() => {
				setTimeout(1, 100);
			}, TypeError);
		});
	});

	describe('#setInterval', function () {
		it('is a function', function () {
			should(setInterval).be.a.Function();
		});

		it('accepts callback and interval', function (finish) {
			var timerId,
				finished = false;
			timerId = setInterval(function () {
				if (finished) {
					return;
				}
				finished = true;
				clearInterval(timerId);
				finish();
			}, 10);
		});

		it.windowsBroken('accepts callback and no specified interval', function (finish) {
			var timerId,
				finished = false;
			timerId = setInterval(function () {
				if (finished) {
					return;
				}
				finished = true;
				clearInterval(timerId);
				finish();
			});
		});

		it.windowsBroken('accepts callback and negative interval, still fires', function (finish) {
			var timerId,
				finished = false;
			timerId = setInterval(function () {
				if (finished) {
					return;
				}
				finished = true;
				clearInterval(timerId);
				finish();
			}, -1);
		});

		it.windowsBroken('accepts callback, interval, and additional arguments', function (finish) {
			var timerId,
				finished = false;
			timerId = setInterval(function (argOne, argTwo, argThree) {
				if (finished) {
					return;
				}
				finished = true;
				clearInterval(timerId);
				try {
					argOne.should.eql(2);
					argTwo.should.eql('3');
					argThree.should.be.an.Object();
					argThree.should.have.a.property('name').which.eql('four');
					finish();
				} catch (err) {
					finish(err);
				}
			}, 10, 2, '3', { name: 'four' });
		});

		it.allBroken('if callback is not a function TypeError is thrown', () => {
			should.throws(() => {
				setInterval(1, 100);
			}, TypeError);
		});
	});

	describe('#clearTimeout', function () {
		it('is a function', function () {
			should(clearTimeout).be.a.Function();
		});

		it('clears timer created with #setTimeout()', function (finish) {
			var timerId = setTimeout(function () {
				finish(new Error('setTimeout should have never fired!'));
			}, 10);
			clearTimeout(timerId);
			setTimeout(function () {
				finish();
			}, 20);
		});

		it('clears timer created with #setInterval()', function (finish) {
			var timerId = setInterval(function () {
				finish(new Error('setInterval should have never fired!'));
			}, 10);
			clearTimeout(timerId);
			setTimeout(function () {
				finish();
			}, 20);
		});
	});

	describe('#clearInterval', function () {
		it('is a function', function () {
			should(clearInterval).be.a.Function();
		});

		it('clears timer created with #setTimeout()', function (finish) {
			var timerId = setTimeout(function () {
				finish(new Error('setTimeout should have never fired!'));
			}, 10);
			clearInterval(timerId);
			setTimeout(function () {
				finish();
			}, 20);
		});

		it('clears timer created with #setInterval()', function (finish) {
			var timerId = setInterval(function () {
				finish(new Error('setInterval should have never fired!'));
			}, 10);
			clearInterval(timerId);
			setTimeout(function () {
				finish();
			}, 20);
		});
	});

	// FIXME: Windows returns undefined for property descriptor. We might want a different way to get them.
	it.windowsMissing('should be able to override', function () {
		const methodNames = [ 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval' ];
		for (const methodName of methodNames) {
			const descriptor = Object.getOwnPropertyDescriptor(global, methodName);
			should(descriptor.configurable).be.true();
			should(descriptor.enumerable).be.true();
			should(descriptor.writable).be.true();
		}
	});

	describe('#setImmediate()', () => {
		it('is a function', () => {
			should(global.setImmediate).be.a.Function();
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
			should(global.clearImmediate).be.a.Function();
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
});
