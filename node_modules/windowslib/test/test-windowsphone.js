/**
 * Tests windowslib's windowsphone module.
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	fs = require('fs'),
	windowslib = require('..');

describe('windowsphone', function () {
	it('namespace should be an object', function () {
		should(windowslib.windowsphone).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find Windows Phone SDK installations', function (done) {
		this.timeout(5000);
		this.slow(2000);

		windowslib.windowsphone.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('windowsphone', 'issues');

			if (results.windowsphone !== null) {
				should(results.windowsphone).be.an.Object;
				Object.keys(results.windowsphone).forEach(function (ver) {
					should(results.windowsphone[ver]).be.an.Object;
					should(results.windowsphone[ver]).have.keys('version', 'registryKey', 'supported', 'path', 'deployCmd', 'selected', 'xapSignTool');

					should(results.windowsphone[ver].version).be.a.String;
					should(results.windowsphone[ver].version).not.equal('');

					should(results.windowsphone[ver].registryKey).be.a.String;
					should(results.windowsphone[ver].registryKey).not.equal('');

					should(results.windowsphone[ver].supported).be.a.Boolean;

					should(results.windowsphone[ver].path).be.a.String;
					should(results.windowsphone[ver].path).not.equal('');
					should(fs.existsSync(results.windowsphone[ver].path)).be.ok;

					if (results.windowsphone[ver].deployCmd !== null) {
						should(results.windowsphone[ver].deployCmd).be.a.String;
						should(results.windowsphone[ver].deployCmd).not.equal('');
					}

					should(results.windowsphone[ver].selected).be.a.Boolean;
				});
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
