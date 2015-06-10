/**
 * Tests windowslib's windows module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	fs = require('fs'),
	windowslib = require('..');

describe('winstore', function () {
	it('namespace should be an object', function () {
		should(windowslib.winstore).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find Windows Store SDK installations', function (done) {
		this.timeout(5000);
		this.slow(2000);

		windowslib.winstore.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('windows', 'issues');

			if (results.windows !== null) {
				should(results.windows).be.an.Object;
				Object.keys(results.windows).forEach(function (ver) {
					should(results.windows[ver]).be.an.Object;
					should(results.windows[ver]).have.keys('version', 'registryKey', 'supported', 'path', 'signTool', 'selected', 'makeCert', 'pvk2pfx');

					should(results.windows[ver].version).be.a.String;
					should(results.windows[ver].version).not.equal('');

					should(results.windows[ver].registryKey).be.a.String;
					should(results.windows[ver].registryKey).not.equal('');

					should(results.windows[ver].supported).be.a.Boolean;

					should(results.windows[ver].path).be.a.String;
					should(results.windows[ver].path).not.equal('');
					should(fs.existsSync(results.windows[ver].path)).be.ok;

					if (results.windows[ver].signTool !== null) {
						should(results.windows[ver].signTool).be.an.Object;
						should(results.windows[ver].signTool.x86).be.a.String;
					}

					should(results.windows[ver].selected).be.a.Boolean;
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
