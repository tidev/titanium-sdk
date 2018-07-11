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
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('console', function () {
	describe('#timeLog', function () {
		it('is a function', function () {
			should(console.timeLog).be.a.Function;
		});

		// FIXME Due to native impl on iOS that doesn't defer to the JS object, we cannot intercept the log calls
		it.iosBroken('prefixes logs with label: and ends with millisecond timing', function () {
			var orig = console.log,
				logs = [];
			try {
				console.log = function (string) {
					logs.push(string);
				};
				console.time('mytimer'); // Start timer
				console.timeLog('mytimer'); // Log time taken so far
				console.timeLog('mytimer', 'with', 'some', 'extra', 'info'); // Log time taken with extra logging
				console.timeLog('mytimer', [ 'a', 'b', 'c' ], { objects: true }); // Should handle Arrays and Objects
				console.timeEnd('mytimer');
				logs.length.should.eql(4);
				// We don't worry about the actual optional data sent along, just the format of the string
				logs.forEach(function (log) {
					log.should.match(/mytimer: \d+ms/);
				});
			} finally {
				console.log = orig;
			}
		});

		// FIXME Due to native impl on iOS that doesn't defer to the JS object, we cannot intercept the log calls
		it.iosBroken('warns and does not log if label doesn\'t exist', function () {
			var origLogFunction = console.log,
				origWarnFunction = console.warn,
				logs = [],
				warnings = [];
			try {
				console.log = function (string) {
					logs.push(string);
				};
				console.warn = function (string) {
					warnings.push(string);
				};
				console.timeLog('mytimer'); // should spit out a warning that label doesn't exist, but not log the timer
				warnings.length.should.eql(1);
				warnings[0].should.eql('Label "mytimer" does not exist');
				logs.length.should.eql(0);
			} finally {
				console.log = origLogFunction;
				console.warn = origWarnFunction;
			}
		});
	});
});
