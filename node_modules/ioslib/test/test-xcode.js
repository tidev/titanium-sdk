/**
 * Tests ioslib's xcode module.
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
	ioslib = require('..');

function checkXcode(xcode) {
	should(xcode).be.an.Object;
	should(xcode).have.keys('xcodeapp', 'path', 'selected', 'version', 'build', 'supported', 'sdks', 'sims', 'simDeviceTypes', 'simRuntimes', 'watchos', 'executables');

	should(xcode.xcodeapp).be.a.String;
	should(xcode.xcodeapp).not.equal('');
	should(fs.existsSync(xcode.xcodeapp)).be.true;
	should(fs.statSync(xcode.xcodeapp).isDirectory()).be.true;

	should(xcode.path).be.a.String;
	should(xcode.path).not.equal('');
	should(fs.existsSync(xcode.path)).be.true;
	should(fs.statSync(xcode.path).isDirectory()).be.true;

	should(xcode.selected).be.a.Boolean;

	should(xcode.version).be.a.String;
	should(xcode.version).not.equal('');

	should(xcode.build).be.a.String;
	should(xcode.build).not.equal('');

	should([null, true, false, 'maybe']).containEql(xcode.supported);

	should(xcode.sdks).be.an.Array;
	xcode.sdks.forEach(function (s) {
		should(s).be.a.String;
		should(s).not.equal('');
	});

	should(xcode.sims).be.an.Array;
	xcode.sims.forEach(function (s) {
		should(s).be.a.String;
		should(s).not.equal('');
	});

	should(xcode.simDeviceTypes).be.an.Object;
	Object.keys(xcode.simDeviceTypes).forEach(function (name) {
		should(xcode.simDeviceTypes[name]).be.an.Object;
		should(xcode.simDeviceTypes[name]).have.keys('name', 'model', 'supportsWatch');
		should(xcode.simDeviceTypes[name].name).be.a.String;
		should(xcode.simDeviceTypes[name].name).not.equal('');
		should(xcode.simDeviceTypes[name].model).be.a.String;
		should(xcode.simDeviceTypes[name].model).not.equal('');
		should(xcode.simDeviceTypes[name].supportsWatch).be.a.Boolean;
	});

	should(xcode.simRuntimes).be.an.Object;
	Object.keys(xcode.simRuntimes).forEach(function (name) {
		should(xcode.simRuntimes[name]).be.an.Object;
		should(xcode.simRuntimes[name]).have.keys('name', 'version');
		should(xcode.simRuntimes[name].name).be.a.String;
		should(xcode.simRuntimes[name].name).not.equal('');
		should(xcode.simRuntimes[name].version).be.a.String;
		should(xcode.simRuntimes[name].version).not.equal('');
	});

	if (xcode.watchos !== null) {
		should(xcode.watchos.sdks).be.an.Array;
		xcode.watchos.sdks.forEach(function (s) {
			should(s).be.a.String;
			should(s).not.equal('');
		});

		should(xcode.watchos.sims).be.an.Array;
		xcode.watchos.sims.forEach(function (s) {
			should(s).be.a.String;
			should(s).not.equal('');
		});
	}

	var keys = ['xcodebuild', 'clang', 'clang_xx', 'libtool', 'lipo', 'otool', 'pngcrush', 'simulator', 'watchsimulator', 'simctl'];
	should(xcode.executables).be.an.Object;
	keys.forEach(function (key) {
		should(xcode.executables).have.property(key);
		if (xcode.executables[key] !== null) {
			should(xcode.executables[key]).be.a.String;
			should(xcode.executables[key]).not.equal('');
			should(fs.existsSync(xcode.executables[key])).be.true;
			should(fs.statSync(xcode.executables[key]).isDirectory()).be.false;
		}
	});
}

describe('xcode', function () {
	it('namespace should be an object', function () {
		should(ioslib.xcode).be.an.Object;
	});

	it('detect should find Xcode installations', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.xcode.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('selectedXcode', 'xcode', 'issues');
			should(results.selectedXcode).be.an.Object;
			should(results.xcode).be.an.Object;
			should(results.issues).be.an.Array;

			checkXcode(results.selectedXcode);

			Object.keys(results.xcode).forEach(function (ver) {
				checkXcode(results.xcode[ver]);
			});

			results.issues.forEach(function (issue) {
				should(issue).be.an.Object;
				should(issue).have.property('id');
				should(issue).have.property('type');
				should(issue).have.property('message');
				should(issue.id).be.a.String;
				should(issue.type).be.a.String;
				should(issue.type).match(/^info|warning|error$/);
				should(issue.message).be.a.String;
			});

			done();
		});
	});
});