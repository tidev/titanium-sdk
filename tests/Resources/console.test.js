/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
let Console;

describe('console', function () {
	it('exists as an object in global namespace', () => {
		should(global.console).be.an.Object;
		should(console).be.an.Object;
	});

	it('can be required', () => {
		// eslint-disable-next-line node/prefer-global/console
		Console = require('console');
		should(Console).be.an.Object; // function?
	});

	it('#log', () => {
		should(console.log).be.a.Function;
	});

	it('#info', () => {
		should(console.info).be.a.Function;
	});

	it('#error', () => {
		should(console.error).be.a.Function;
	});

	it('#warn', () => {
		should(console.warn).be.a.Function;
	});

	it('#time', () => {
		should(console.time).be.a.Function;
	});

	it('#timeEnd', () => {
		should(console.timeEnd).be.a.Function;
	});

	describe('#timeLog', () => {
		it('is a function', () => {
			should(console.timeLog).be.a.Function;
		});

		it('prefixes logs with label: and ends with millisecond timing', function () {
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

		it('warns and does not log if label doesn\'t exist', function () {
			const origLogFunction = console.log;
			const logs = [];
			const warnings = [];
			function warningTest(warning) {
				warnings.push(warning);
			}
			process.on('warning', warningTest);
			try {
				console.log = function (string) {
					logs.push(string);
				};
				console.timeLog('mytimer'); // should spit out a warning that label doesn't exist, but not log the timer
				warnings.length.should.eql(1);
				warnings[0].message.should.eql('Label "mytimer" does not exist');
				logs.length.should.eql(0);
			} finally {
				console.log = origLogFunction;
				process.off('warning', warningTest);
			}
		});
	});

	// TODO: test for: dir, assert, dirxml

	describe('#clear', () => {
		it('is a function', () => {
			should(console.clear).be.a.Function;
		});
	});

	describe('#count', () => {
		it('is a function', () => {
			should(console.count).be.a.Function;
		});

		it('outputs counter with label', () => {
			const orig = console.log;
			const logs = [];
			try {
				console.log = function (string) {
					logs.push(string);
				};
				console.count('mylabel');
				console.count();
				console.count();
				console.count('mylabel');
				console.countReset();
				console.count();
				console.countReset('mylabel');
				console.count('mylabel');
				logs.length.should.eql(6);
				logs[0].should.eql('mylabel: 1');
				logs[1].should.eql('default: 1');
				logs[2].should.eql('default: 2');
				logs[3].should.eql('mylabel: 2');
				logs[4].should.eql('default: 1');
				logs[5].should.eql('mylabel: 1');
			} finally {
				console.log = orig;
			}
		});
	});

	describe('#countReset', () => {
		it('is a function', () => {
			should(console.countReset).be.a.Function;
		});
	});

	describe('#group', () => {
		it('is a function', () => {
			should(console.group).be.a.Function;
		});

		it('increases indent by 2 spaces', () => {
			// FIXME: We can't just hijack console.log, because that's where we handle the indents!
			// Maybe we need to add the constructor stuff so we can create a console hooked to our own "stream"?
			// Note that we don't have a great mapping to stdout/stderr, because android has actual log priorities that map to the Ti.API/console methods
			// Whereas Node assumes a "dumb" stdout without specific priorities
			// instead it treats log/debug/info/dirxml as -> stdout, warn/error as -> stderr
			const logs = [];
			const fakeTiAPI = {
				warn: msg => {
					logs.push(`[WARN]${msg}`);
				},
				debug: msg => {
					logs.push(`[DEBUG]${msg}`);
				},
				info: msg => {
					logs.push(`[INFO]${msg}`);
				},
				error: msg => {
					logs.push(`[ERROR]${msg}`);
				},
				apiName: 'Ti.API',
			};
			const console = new Console(fakeTiAPI);
			console.group('mylabel');
			console.log('this should be indented');
			console.groupEnd();
			console.group();
			console.group('something');
			console.warn('this should be indented twice'); // FIXME: Hijack warn too!
			console.groupEnd();
			console.log('this should be indented');
			console.groupEnd();
			console.log('this should NOT be indented');
			logs.length.should.eql(6);
			logs[0].should.eql('[INFO]mylabel');
			logs[1].should.eql('[INFO]  this should be indented');
			logs[2].should.eql('[INFO]  something');
			logs[3].should.eql('[WARN]    this should be indented twice');
			logs[4].should.eql('[INFO]  this should be indented');
			logs[5].should.eql('[INFO]this should NOT be indented');
		});
	});

	describe('#groupEnd', () => {
		it('is a function', () => {
			should(console.groupEnd).be.a.Function;
		});
	});

	describe('#groupCollapsed', () => {
		it('is a function', () => {
			should(console.groupCollapsed).be.a.Function;
		});
	});

	describe('#dirxml', () => {
		it('is a function', () => {
			should(console.dirxml).be.a.Function;
		});
	});

	describe('#dir', () => {
		it('is a function', () => {
			should(console.dir).be.a.Function;
		});
		// TODO: Hijack and test that it basically does inspect on the value passed in?
		// Note that our impl calls directly to the native impl, so not sure how we can hijack the underlying console.log...
	});
});
