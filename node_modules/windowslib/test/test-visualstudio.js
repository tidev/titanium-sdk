/**
 * Tests windowslib's visualstudio module.
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

describe('visualstudio', function () {
	it('namespace should be an object', function () {
		should(windowslib.visualstudio).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find Visual Studio installations', function (done) {
		this.timeout(5000);
		this.slow(2000);

		windowslib.visualstudio.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('selectedVisualStudio', 'visualstudio', 'issues');

			should(results.selectedVisualStudio).be.an.Object;
			checkVisualStudio(results.selectedVisualStudio);

			if (results.visualstudio !== null) {
				should(results.visualstudio).be.an.Object;
				Object.keys(results.visualstudio).forEach(function (ver) {
					checkVisualStudio(results.visualstudio[ver]);
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

function checkVisualStudio(visualstudio) {
	should(visualstudio).be.an.Object;
	should(visualstudio).have.keys('version', 'registryKey', 'supported', 'vcvarsall', 'msbuildVersion', 'wpsdk', 'selected', 'path', 'clrVersion');

	should(visualstudio.version).be.a.String;
	should(visualstudio.version).not.equal('');

	should(visualstudio.registryKey).be.a.String;
	should(visualstudio.registryKey).not.equal('');

	should(visualstudio.supported).be.a.Boolean;

	should(visualstudio.vcvarsall).be.a.String;
	should(visualstudio.vcvarsall).not.equal('');

	should(visualstudio.msbuildVersion).be.a.String;
	should(visualstudio.msbuildVersion).not.equal('');

	if (visualstudio.wpsdk !== null) {
		should(visualstudio.wpsdk).be.an.Object;
		Object.keys(visualstudio.wpsdk).forEach(function (ver) {
			should(visualstudio.wpsdk[ver]).be.an.Object;
			should(visualstudio.wpsdk[ver]).have.keys('vcvarsphone');

			should(visualstudio.wpsdk[ver].vcvarsphone).be.a.String;
			should(visualstudio.wpsdk[ver].vcvarsphone).not.equal('');
			should(fs.existsSync(visualstudio.wpsdk[ver].vcvarsphone)).be.ok;
		});
	}

	should(visualstudio.selected).be.a.Boolean;

	should(visualstudio.path).be.a.String;
	should(visualstudio.path).not.equal('');
	should(fs.existsSync(visualstudio.path)).be.ok;

	should(visualstudio.clrVersion).be.a.String;
	should(visualstudio.clrVersion).not.equal('');
}
