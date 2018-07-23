/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Timers', function () {
	it('setTimeout', function () {
		should(setTimeout).be.a.Function;
	});

	it('setInterval', function () {
		should(setInterval).be.a.Function;
	});

	it('clearTimeout', function () {
		should(clearTimeout).be.a.Function;
	});

	it('clearInterval', function () {
		should(clearInterval).be.a.Function;
	});

	it('should be able to override', function () {
		const methodNames = [ 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval' ];
		for (const methodName of methodNames) {
			const descriptor = Object.getOwnPropertyDescriptor(global, methodName);
			should(descriptor.configurable).be.true;
			should(descriptor.enumerable).be.true;
			should(descriptor.writable).be.true;
		}
	});
});
