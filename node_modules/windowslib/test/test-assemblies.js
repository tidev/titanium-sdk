/**
 * Tests windowslib's assemblies module.
 *
 * @copyright
 * Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	fs = require('fs'),
	windowslib = require('..');

describe('assemblies', function () {
	it('namespace should be an object', function () {
		should(windowslib.assemblies).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find required assemblies', function (done) {
		this.timeout(5000);
		this.slow(2000);

		windowslib.assemblies.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('assemblies', 'issues');

			should(results.assemblies).be.an.Object;
			Object.keys(results.assemblies).forEach(function (assembly) {
				if (results.assemblies[assembly] !== null) {
					should(results.assemblies[assembly]).be.an.Object;
					Object.keys(results.assemblies[assembly]).forEach(function (ver) {
						should(results.assemblies[assembly][ver]).be.an.Object;
						should(results.assemblies[assembly][ver]).have.keys('assemblyFile', 'dotNetVersion', 'assemblyVersion', 'publicKeyToken');

						should(results.assemblies[assembly][ver].assemblyFile).be.a.String;
						should(results.assemblies[assembly][ver].assemblyFile).not.equal('');
						should(fs.existsSync(results.assemblies[assembly][ver].assemblyFile)).be.ok;

						should(results.assemblies[assembly][ver].dotNetVersion).be.a.String;
						should(results.assemblies[assembly][ver].dotNetVersion).not.equal('');

						should(results.assemblies[assembly][ver].assemblyVersion).be.a.String;
						should(results.assemblies[assembly][ver].assemblyVersion).not.equal('');

						should(results.assemblies[assembly][ver].publicKeyToken).be.a.String;
						should(results.assemblies[assembly][ver].publicKeyToken).not.equal('');
					});
				}
			});

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
