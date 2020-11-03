/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.API', function () {
	// FIXME Get working on Android, not sure why it doesn't!
	it.androidBroken('apiName', function () {
		should(Ti.API).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.API.apiName).be.eql('Ti.API');
	});

	it('#debug()', function () {
		should(Ti.API.debug).be.a.Function();
		// return value is void/undefined
		// TODO How can we verify behavior, accepting array of string args, or accepting/rejecting non string args?
		should(Ti.API.debug('debug')).be.undefined();
	});

	it('#error()', function () {
		should(Ti.API.error).be.a.Function();
		should(Ti.API.error('error')).be.undefined();
	});

	describe('#info()', function () {
		it('is a Function', function () {
			should(Ti.API.info).be.a.Function();
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
			should(Ti.API.log).be.a.Function();
			should(Ti.API.log('debug', 'log')).be.undefined();
		});

		it('accepts one non-String parameter', function () {
			Ti.API.log({ key: 'value' }); // used to cause crash on Android
		});

		it('accepts second non-String parameter', function () {
			Ti.API.log('debug', { key: 'value' }); // used to cause crash on Android
		});
	});

	// TODO Should timestamp function be available on other platforms?
	it.ios('#timestamp()', function () {
		should(Ti.API.timestamp).be.a.Function();
		should(Ti.API.debug('timestamp')).be.undefined();
	});

	it('#trace()', function () {
		should(Ti.API.trace).be.a.Function();
		should(Ti.API.trace('trace')).be.undefined();
	});

	it('#warn()', function () {
		should(Ti.API.warn).be.a.Function();
		should(Ti.API.warn('warn')).be.undefined();
	});

	it.android('TIMOB-25757', function () {
		should.not.exist(Ti.API.bubbleParent);
	});

	it('integer to boolean conversion', function () {
		var view = Ti.UI.createView({ bubbleParent: 0 });

		should(view.bubbleParent).be.be.false();
		view.bubbleParent = 1;
		should(view.bubbleParent).be.be.true();
	});
});
