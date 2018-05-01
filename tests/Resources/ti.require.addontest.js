/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('requireJS', function () {
	it('require should not fail when exports is falsey', function () {
		var files = [
			{ filename: 'empty-double', expected: '' },
			{ filename: 'empty-single', expected: '' },
			{ filename: 'false', expected: false },
			{ filename: 'nan', expected: NaN },
			{ filename: 'null', expected: null },
			{ filename: 'undefined', expected: undefined },
			{ filename: 'zero', expected: 0 }
		];
		for (var obj in files) {
			obj = files[obj];
			var result;
			should.doesNotThrow(
				// eslint-disable-next-line no-loop-func
				function () {
					result = require('./fixtures/' + obj.filename); // eslint-disable-line security/detect-non-literal-require
				}
			);
			if (obj.filename === 'nan') {
				isNaN(result).should.be.true;
			}  else {
				should(result).be.exactly(obj.expected);
			}
		}
	});
});
