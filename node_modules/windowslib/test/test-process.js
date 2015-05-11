/**
 * Tests windowslib's process module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
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
});