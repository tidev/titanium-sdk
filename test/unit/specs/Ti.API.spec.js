/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global Ti, jasmine */
/* eslint no-unused-expressions: "off" */

'use strict';

describe('Titanium.API', function () {
	it('apiName', function () {
        expect(Ti.API.apiName).toEqual(jasmine.any(String));
		expect(Ti.API.apiName).toEqual('Ti.API');
	});

	it('#debug()', function () {
		expect(Ti.API.debug).toEqual(jasmine.any(Function));
		// return value is void/undefined
		// TODO How can we verify behavior, accepting array of string args, or accepting/rejecting non string args?
		expect(Ti.API.debug('debug')).toBeUndefined();
	});

	it('#error()', function () {
		expect(Ti.API.error).toEqual(jasmine.any(Function));
		expect(Ti.API.error('error')).toBeUndefined();
	});

	describe('#info()', function () {
		it('is a Function', function () {
			expect(Ti.API.info).toEqual(jasmine.any(Function));
		});

		it('accepts String argument', function () {
			Ti.API.info('Hello');
		});

		it('accepts Object argument', function () {
			Ti.API.info({});
		});

		it('accepts null argument', function () {
			Ti.API.info(null);
		});

		it('accepts undefined argument', function () {
			Ti.API.info(undefined);
		});

		it('accepts Array argument', function () {
			Ti.API.info([]);
		});

		it('accepts Number argument', function () {
			Ti.API.info(101);
		});
	});

	describe('#log()', function () {
		it('is a Function', function () {
			expect(Ti.API.log).toEqual(jasmine.any(Function));
			expect(Ti.API.log('debug', 'log')).toBeUndefined();
		});

		it('accepts one non-String parameter', function () {
			Ti.API.log({
				key: 'value'
			}); // used to cause crash on Android
		});

		it('accepts second non-String parameter', function () {
			Ti.API.log('debug', {
				key: 'value'
			}); // used to cause crash on Android
		});
	});

	// TODO expect timestamp function be available on other platforms?
	// it('#timestamp()', function () {
	//	expect(Ti.API.timestamp).toEqual(jasmine.any(Function));
	//	expect(Ti.API.debug('timestamp')).toBeUndefined();
	// });

	it('#trace()', function () {
		expect(Ti.API.trace).toEqual(jasmine.any(Function));
		expect(Ti.API.trace('trace')).toBeUndefined();
	});

	it('#warn()', function () {
		expect(Ti.API.warn).toEqual(jasmine.any(Function));
		expect(Ti.API.warn('warn')).toBeUndefined();
	});

	it('TIMOB-25757', function () {
		expect(Ti.API.bubbleParent).toBeUndefined();
	});
});
