/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, global */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Timers', function () {
	describe('#setTimeout', function () {
		it('is a function', function () {
			should(setTimeout).be.a.Function;
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

		it('accepts callback and negative interval, still fires', function (finish) {
			setTimeout(function () {
				finish();
			}, -1);
		});

		it('accepts callback, interval, and additional arguments', function (finish) {
			setTimeout(function (argOne, argTwo, argThree) {
				try {
					argOne.should.eql(2);
					argTwo.should.eql('3');
					argThree.should.be.an.Object;
					argThree.should.have.a.property('name').which.eql('four');
					finish();
				} catch (err) {
					finish(err);
				}
			}, 1, 2, '3', { name: 'four' });
		});
	});

	describe('#setInterval', function () {
		it('is a function', function () {
			should(setInterval).be.a.Function;
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

		it('accepts callback and no specified interval', function (finish) {
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

		it('accepts callback and negative interval, still fires', function (finish) {
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

		it('accepts callback, interval, and additional arguments', function (finish) {
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
					argThree.should.be.an.Object;
					argThree.should.have.a.property('name').which.eql('four');
					finish();
				} catch (err) {
					finish(err);
				}
			}, 10, 2, '3', { name: 'four' });
		});
	});

	describe('#clearTimeout', function () {
		it('is a function', function () {
			should(clearTimeout).be.a.Function;
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
			should(clearInterval).be.a.Function;
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

	it.windowsBroken('should be able to override', function () {
		const methodNames = [ 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval' ];
		for (const methodName of methodNames) {
			const descriptor = Object.getOwnPropertyDescriptor(global, methodName);
			should(descriptor.configurable).be.true;
			should(descriptor.enumerable).be.true;
			should(descriptor.writable).be.true;
		}
	});
});
