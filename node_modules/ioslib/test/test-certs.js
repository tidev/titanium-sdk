/**
 * Tests ioslib's certs module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const ioslib = require('..');

describe('certs', function () {
	it('namespace should be an object', function () {
		should(ioslib.certs).be.an.Object;
	});

	it('detect certs', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.certs.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('certs', 'issues');

			should(results.certs).have.keys('keychains', 'wwdr');
			should(results.certs.keychains).be.an.Object;
			should(results.certs.wwdr).be.a.Boolean;

			Object.keys(results.certs.keychains).forEach(function (keychain) {
				should(results.certs.keychains[keychain]).be.an.Object;
				should(results.certs.keychains[keychain]).have.keys('developer', 'distribution');
				should(results.certs.keychains[keychain].developer).be.an.Array;
				results.certs.keychains[keychain].developer.forEach(function (d) {
					should(d).be.an.Object;
					should(d).have.keys('name', 'fullname', 'pem', 'before', 'after', 'expired', 'invalid');
					should(d.name).be.a.String;
					should(d.pem).be.a.String;
					should(d.before).be.a.Date;
					should(d.after).be.a.Date;
					should(d.expired).be.a.Boolean;
					should(d.invalid).be.a.Boolean;
				});
				should(results.certs.keychains[keychain].distribution).be.an.Array;
				results.certs.keychains[keychain].distribution.forEach(function (d) {
					should(d).be.an.Object;
					should(d).have.keys('name', 'fullname', 'pem', 'before', 'after', 'expired', 'invalid');
					should(d.name).be.a.String;
					should(d.pem).be.a.String;
					should(d.before).be.a.Date;
					should(d.after).be.a.Date;
					should(d.expired).be.a.Boolean;
					should(d.invalid).be.a.Boolean;
				});
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

	it('return a emitter', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.certs.detect({ bypassCache: true }).on('detected', function (results) {
			should(results).be.an.Object;
			done();
		});
	});

	it('return results from cache', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.certs.detect({ bypassCache: false }).on('detected', function (results) {
			should(results).be.an.Object;
			done();
		});
	});

	it('watch for changes for 10 seconds', function (done) {
		this.timeout(50000);
		this.slow(50000);

		ioslib.certs.watch({ watchInterval: 1000 }, function (err, results) {
			should(results).be.an.Object;
		});

		setTimeout(function () {
			ioslib.certs.unwatch();
			done();
		}, 10000);
	});

	it('stop watching for updates', function (done) {
		this.timeout(50000);
		this.slow(50000);

		var counter = 0,
			unwatch = ioslib.certs.watch({ watchInterval: 4000 }, function (err, results) {
				should(results).be.an.Object;
				if (++counter > 1) {
					done(new Error('Watcher event was fired despite unwatching'));
				}
			});

		setTimeout(function () {
			unwatch();
			setTimeout(function () {
				done();
			}, 6000);
		}, 2000);
	});
});