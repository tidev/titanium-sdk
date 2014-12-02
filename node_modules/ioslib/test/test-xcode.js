/**
 * Tests ioslib's xcode module.
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
	ioslib = require('..');

function checkXcode(xcode) {
	should(xcode).be.an.Object;
	should(xcode).have.keys('xcodeapp', 'path', 'selected', 'version', 'build', 'supported', 'sdks', 'sims', 'executables');

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

	should(xcode.executables).be.an.Object;
	should(xcode.executables).have.keys('xcodebuild', 'clang', 'clang_xx', 'libtool', 'lipo', 'otool');

	should(xcode.executables.xcodebuild).be.a.String;
	should(xcode.executables.xcodebuild).not.equal('');
	should(fs.existsSync(xcode.executables.xcodebuild)).be.true;
	should(fs.statSync(xcode.executables.xcodebuild).isDirectory()).be.false;

	should(xcode.executables.clang).be.a.String;
	should(xcode.executables.clang).not.equal('');
	should(fs.existsSync(xcode.executables.clang)).be.true;
	should(fs.statSync(xcode.executables.clang).isDirectory()).be.false;

	should(xcode.executables.clang_xx).be.a.String;
	should(xcode.executables.clang_xx).not.equal('');
	should(fs.existsSync(xcode.executables.clang_xx)).be.true;
	should(fs.statSync(xcode.executables.clang_xx).isDirectory()).be.false;

	should(xcode.executables.libtool).be.a.String;
	should(xcode.executables.libtool).not.equal('');
	should(fs.existsSync(xcode.executables.libtool)).be.true;
	should(fs.statSync(xcode.executables.libtool).isDirectory()).be.false;

	should(xcode.executables.lipo).be.a.String;
	should(xcode.executables.lipo).not.equal('');
	should(fs.existsSync(xcode.executables.lipo)).be.true;
	should(fs.statSync(xcode.executables.lipo).isDirectory()).be.false;

	should(xcode.executables.otool).be.a.String;
	should(xcode.executables.otool).not.equal('');
	should(fs.existsSync(xcode.executables.otool)).be.true;
	should(fs.statSync(xcode.executables.otool).isDirectory()).be.false;
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