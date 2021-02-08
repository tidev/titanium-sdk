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
		should(global.console).be.an.Object();
		should(console).be.an.Object();
	});

	it('can be required, exposes global console', () => {
		// eslint-disable-next-line node/prefer-global/console
		const requiredConsole = require('console');
		should(requiredConsole).be.an.Object();
		should(requiredConsole).eql(global.console);
	});

	it('exposes constructor as property off global console', () => {
		// eslint-disable-next-line node/prefer-global/console
		const requiredConsole = require('console');
		should(global.console.Console).be.a.Function();
		should(requiredConsole.Console).be.a.Function();
		should(requiredConsole.Console).eql(global.console.Console);
		Console = global.console.Console;
	});

	it('#log', () => {
		should(console.log).be.a.Function();
	});

	it('#info', () => {
		should(console.info).be.a.Function();
	});

	it('#error', () => {
		should(console.error).be.a.Function();
	});

	it('#warn', () => {
		should(console.warn).be.a.Function();
	});

	it('#trace', () => {
		should(console.trace).be.a.Function();
	});

	it('#time', () => {
		should(console.time).be.a.Function();
	});

	it('#timeEnd', () => {
		should(console.timeEnd).be.a.Function();
	});

	describe('#timeLog', () => {
		it('is a function', () => {
			should(console.timeLog).be.a.Function();
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
				should(logs.length).eql(4);
				// We don't worry about the actual optional data sent along, just the format of the string
				logs.forEach(function (log) {
					should(log).match(/mytimer: \d+ms/);
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
				should(warnings.length).eql(1);
				should(warnings[0].message).eql('Label "mytimer" does not exist');
				should(logs.length).eql(0);
			} finally {
				console.log = origLogFunction;
				process.off('warning', warningTest);
			}
		});
	});

	describe('#clear', () => {
		it('is a function', () => {
			should(console.clear).be.a.Function();
		});
	});

	describe('#count', () => {
		it('is a function', () => {
			should(console.count).be.a.Function();
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
				should(logs.length).eql(6);
				should(logs[0]).eql('mylabel: 1');
				should(logs[1]).eql('default: 1');
				should(logs[2]).eql('default: 2');
				should(logs[3]).eql('mylabel: 2');
				should(logs[4]).eql('default: 1');
				should(logs[5]).eql('mylabel: 1');
			} finally {
				console.log = orig;
			}
		});
	});

	describe('#countReset', () => {
		it('is a function', () => {
			should(console.countReset).be.a.Function();
		});
	});

	describe('#group', () => {
		it('is a function', () => {
			should(console.group).be.a.Function();
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
			should(logs.length).eql(6);
			should(logs[0]).eql('[INFO]mylabel');
			should(logs[1]).eql('[INFO]  this should be indented');
			should(logs[2]).eql('[INFO]  something');
			should(logs[3]).eql('[WARN]    this should be indented twice');
			should(logs[4]).eql('[INFO]  this should be indented');
			should(logs[5]).eql('[INFO]this should NOT be indented');
		});
	});

	describe('#groupEnd', () => {
		it('is a function', () => {
			should(console.groupEnd).be.a.Function();
		});
		// functionality is tested above in pairs with #group()
	});

	describe('#groupCollapsed', () => {
		it('is a function', () => {
			should(console.groupCollapsed).be.a.Function();
		});
	});

	describe('#dirxml', () => {
		it('is a function', () => {
			should(console.dirxml).be.a.Function();
		});
	});

	describe('#dir', () => {
		let logs = [];
		let console;

		before(() => {
			const fakeTiAPI = {
				info: msg => {
					logs.push(msg);
				},
				apiName: 'Ti.API',
			};
			console = new Console(fakeTiAPI);
		});

		beforeEach(() => {
			logs = [];
		});

		it('is a function', () => {
			should(console.dir).be.a.Function();
		});

		it('outputs number as-is', () => {
			console.dir(1);
			should(logs.length).eql(1);
			should(logs[0]).eql('1');
		});

		it('outputs string as-is', () => {
			console.dir('1');
			should(logs.length).eql(1);
			should(logs[0]).eql('\'1\'');
		});

		it('outputs null as-is', () => {
			console.dir(null);
			should(logs.length).eql(1);
			should(logs[0]).eql('null');
		});

		it('outputs undefined as-is', () => {
			console.dir(undefined);
			should(logs.length).eql(1);
			should(logs[0]).eql('undefined');
		});

		it('outputs object', () => {
			console.dir({ 1: [ 2 ] });
			should(logs.length).eql(1);
			should(logs[0]).eql('{ \'1\': [ 2 ] }');
		});
	});

	describe('#assert', () => {
		it('is a function', () => {
			should(console.assert).be.a.Function();
		});
	});

	describe('#table', () => {
		it('is a function', () => {
			should(console.table).be.a.Function();
		});
	});

	describe('constructor', () => {
		// TODO: test validation of stdout/stderr (have write function), various options
		it('accepts stdout, stderr, ignoreErrors arguments', () => {
			const events = require('events');
			const stdout = new events.EventEmitter();
			stdout.logs = [];
			stdout.write = function (contents) {
				this.logs.push(contents);
			};
			const stderr = new events.EventEmitter();
			stderr.logs = [];
			stderr.write = function (contents) {
				this.logs.push(contents);
			};
			const console = new Console(stdout, stderr, false);
			console.log('log'); // stdout
			console.info('info'); // stdout
			console.dirxml('dirxml'); // stdout
			console.warn('warn'); // stderr
			console.error('error'); // stderr
			console.trace('trace'); // stderr
			should(stdout.logs.length).eql(3);
			should(stdout.logs[0]).eql('log');
			should(stdout.logs[1]).eql('info');
			should(stdout.logs[2]).eql('dirxml');
			should(stderr.logs.length).eql(3);
			should(stderr.logs[0]).eql('warn');
			should(stderr.logs[1]).eql('error');
			should(stderr.logs[2]).eql('trace');
		});

		it('squashes sync errors on stdout write by default (ignoreErrors = true)', () => {
			const events = require('events');
			const stdout = new events.EventEmitter();
			stdout.write = function () {
				throw new Error('testing');
			};

			const stderr = new events.EventEmitter();
			stderr.logs = [];
			stderr.write = function (contents) {
				this.logs.push(contents);
			};
			const console = new Console(stdout, stderr);
			console.log('log'); // should not throw the error
		});

		// TODO: How do we test if a stream throws an async error?

		it('doesnt handle sync errors on stdout write if ignoreErrors is false', () => {
			const events = require('events');
			const stdout = new events.EventEmitter();
			stdout.write = function () {
				throw new Error('testing');
			};

			const stderr = new events.EventEmitter();
			stderr.logs = [];
			stderr.write = function (contents) {
				this.logs.push(contents);
			};
			const console = new Console(stdout, stderr, false);
			should.throws(() => {
				console.log('log');
			}, Error);
		});

		it('accepts options object with only stdout', () => {
			const events = require('events');
			const stdout = new events.EventEmitter();
			stdout.logs = [];
			stdout.write = function (contents) {
				this.logs.push(contents);
			};
			const console = new Console({ stdout });
			console.log('log'); // stdout
			console.info('info'); // stdout
			console.dirxml('dirxml'); // stdout
			console.warn('warn'); // stderr
			console.error('error'); // stderr
			should(stdout.logs.length).eql(5);
			should(stdout.logs[0]).eql('log');
			should(stdout.logs[1]).eql('info');
			should(stdout.logs[2]).eql('dirxml');
			should(stdout.logs[3]).eql('warn');
			should(stdout.logs[4]).eql('error');
		});
	});
});
