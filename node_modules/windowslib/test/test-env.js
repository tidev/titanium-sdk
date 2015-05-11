/**
 * Tests windowslib's env module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const windowslib = require('..');

describe('env', function () {
	it('namespace should be an object', function () {
		should(windowslib.env).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find dev environment dependencies', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.env.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('os', 'powershell', 'issues');

			should(results.os).be.an.Object;
			should(results.os).have.keys('name', 'version');

			if (results.os.name !== null) {
				should(results.os.name).be.a.String;
			}

			if (results.os.version !== null) {
				should(results.os.version).be.a.String;
			}

			should(results.powershell).be.an.Object;
			should(results.powershell).have.keys('enabled');

			if (results.os.version !== null) {
				should(results.powershell.enabled).be.a.Boolean;
			}

			should(results.issues).be.an.Array;
			results.issues.forEach(function (issue) {
				should(issue).be.an.Object;
				should(issue).have.keys('id', 'type', 'message');
				should(issue.id).be.a.String;
				should(issue.type).be.a.String;
				should(issue.type).match(/^info|warning|error$/);
				should(issue.message).be.a.String;
			});

			done();
		});
	});
});