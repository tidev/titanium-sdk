/**
 * Tests windowslib's process module.
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const windowslib = require('..');

describe('process', function () {
	it('namespace should be an object', function () {
		should(windowslib.process).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('list all processes', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.process.list(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Array;

			results.forEach(function (proc) {
				should(proc).have.keys('name', 'pid', 'title');
			});

			done();
		});
	});

	(process.platform === 'win32' ? it : it.skip)('find process by pid returns null for process not running', function (done) {
		this.timeout(500);
		this.slow(200);
		// FIXME let's hope there's no process using this pid?
		windowslib.process.find('12345', function (err, p) {
			if (err) {
				return done(err);
			}

			should(p).be.null;

			done();
		});
	});

	(process.platform === 'win32' ? it : it.skip)('find process by pid returns error if pid is not integer', function (done) {
		this.timeout(500);
		this.slow(200);
		// use bad pid value
		windowslib.process.find('abc', function (err, p) {
			if (!err) {
				return done('tasklist should have failed due to invalid pid type');
			}

			should(p).be.null;

			done();
		});
	});

	(process.platform === 'win32' ? it : it.skip)('find process by pid', function (done) {
		this.timeout(500);
		this.slow(200);
		// find our own process
		windowslib.process.find(process.pid, function (err, p) {
			if (err) {
				return done(err);
			}

			should(p).be.an.Object;
			should(p).have.keys('name', 'pid', 'title');

			done();
		});
	});
});
