/**
 * Tests ioslib's env module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	ioslib = require('..');

describe('env', function () {
	it('namespace should be an object', function () {
		should(ioslib.env).be.an.Object;
	});

	it('detect should find dev environment dependencies', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.env.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('executables', 'issues');

			should(results.executables).be.an.Object;
			should(results.executables).have.keys('security', 'xcodeSelect');

			if (results.executables.security !== null) {
				should(results.executables.security).be.a.String;
				should(fs.existsSync(results.executables.security)).be.ok;
			}

			if (results.executables.xcodeSelect !== null) {
				should(results.executables.xcodeSelect).be.a.String;
				should(fs.existsSync(results.executables.xcodeSelect)).be.ok;
			}

			results.should.have.property('issues');
			should(results.issues).be.an.Array;

			done();
		});
	});
});