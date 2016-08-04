/**
 * Tests ioslib's provisioning module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const ioslib = require('..');

function checkProfiles(list) {
	list.forEach(function (pp) {
		should(pp).be.an.Object;
		should(pp).have.keys('file', 'uuid', 'name', 'appPrefix', 'creationDate', 'expirationDate', 'expired', 'certs', 'devices', 'team', 'appId', 'getTaskAllow', 'apsEnvironment');

		should(pp.file).be.a.String;
		should(pp.file).not.equal('');

		should(pp.uuid).be.a.String;
		should(pp.uuid).not.equal('');

		should(pp.name).be.a.String;
		should(pp.name).not.equal('');

		should(pp.appPrefix).be.a.String;
		should(pp.appPrefix).not.equal('');

		should(pp.creationDate).be.a.Date;
		should(pp.expirationDate).be.a.Date;

		should(pp.expired).be.a.Boolean;

		should(pp.certs).be.an.Array;
		pp.certs.forEach(function (s) {
			should(s).be.a.String;
			should(s).not.equal('');
		});

		if (pp.devices !== null) {
			should(pp.devices).be.an.Array;
			pp.devices.forEach(function (s) {
				should(s).be.a.String;
				should(s).not.equal('');
			});
		}

		should(pp.team).be.an.Array;
		pp.team.forEach(function (s) {
			should(s).be.a.String;
			should(s).not.equal('');
		});

		should(pp.appId).be.a.String;
		should(pp.appId).not.equal('');

		should(pp.getTaskAllow).be.a.Boolean;

		should(pp.apsEnvironment).be.a.String;
	});
}

describe('provisioning', function () {
	it('namespace should be an object', function () {
		should(ioslib.provisioning).be.an.Object;
	});

	it('detect provisioning profiles', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('provisioning', 'issues');

			should(results.provisioning).be.an.Object;
			should(results.provisioning).have.keys('profileDir', 'development', 'distribution', 'adhoc');

			should(results.provisioning.profileDir).be.a.String;
			should(results.provisioning.profileDir).not.equal('');

			should(results.provisioning.development).be.an.Array;
			checkProfiles(results.provisioning.development);

			should(results.provisioning.distribution).be.an.Array;
			checkProfiles(results.provisioning.distribution);

			should(results.provisioning.adhoc).be.an.Array;
			checkProfiles(results.provisioning.adhoc);

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

		ioslib.provisioning.detect({ bypassCache: true }).on('detected', function (results) {
			should(results).be.an.Object;
			done();
		});
	});

	it('return results from cache', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect({ bypassCache: false }).on('detected', function (results) {
			should(results).be.an.Object;
			done();
		});
	});

	it('find best provisioning profiles without a cert and without a device', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect({ bypassCache: true }, function (err, all) {
			ioslib.provisioning.find(function (err, found) {
				if (err) {
					done(err);
				} else {
					should(found).be.an.Array;
					should(found).length(all.provisioning.development.length + all.provisioning.distribution.length + all.provisioning.adhoc.length);
					checkProfiles(found);
					done();
				}
			});
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('find best provisioning profiles with a cert, but without a device', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect({ bypassCache: true }, function (err, all) {
			var pem = null,
				matches = 0;

			function fn(pp) {
				if (!pp.expired) {
					pem || (pem = pp.certs[0]);
					if (pp.certs.indexOf(pem) !== -1) {
						matches++;
					}
				}
			}

			all.provisioning.development.forEach(fn);
			all.provisioning.distribution.forEach(fn);
			all.provisioning.adhoc.forEach(fn);

			if (pem === null) {
				return done(new Error('No provisioning profiles found to run this test'));
			}

			ioslib.provisioning.find({
				certs: { pem: pem }
			}, function (err, found) {
				if (err) {
					done(err);
				} else {
					should(found).be.an.Array;
					should(found).be.length(matches);
					checkProfiles(found);
					done();
				}
			});
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('find best provisioning profiles without a cert, but with a device', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect({ bypassCache: true }, function (err, all) {
			var device = null,
				matches = 0;

			function fn(pp) {
				if (!pp.expired && pp.devices !== null && pp.devices.length) {
					device || (device = pp.devices[0]);
					if (pp.devices.indexOf(device) !== -1) {
						matches++;
					}
				}
			}

			all.provisioning.development.forEach(fn);
			all.provisioning.distribution.forEach(fn);
			all.provisioning.adhoc.forEach(fn);

			if (device === null) {
				return done(new Error('No provisioning profiles found to run this test'));
			}

			ioslib.provisioning.find({
				deviceUDIDs: device
			}, function (err, found) {
				if (err) {
					done(err);
				} else {
					should(found).be.an.Array;
					should(found).be.length(matches);
					checkProfiles(found);
					done();
				}
			});
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('find best provisioning profiles with a cert and a device', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.provisioning.detect({ bypassCache: true }, function (err, all) {
			var pem = null,
				device = null,
				matches = 0;

			function fn(pp) {
				if (!pp.expired && pp.devices !== null && pp.devices.length) {
					pem || (pem = pp.certs[0]);
					device || (device = pp.devices[0]);
					if (pp.devices.indexOf(device) !== -1 && pp.certs.indexOf(pem) !== -1) {
						matches++;
					}
				}
			}

			all.provisioning.development.forEach(fn);
			all.provisioning.distribution.forEach(fn);
			all.provisioning.adhoc.forEach(fn);

			if (pem === null || device === null) {
				return done(new Error('No provisioning profiles found to run this test'));
			}

			ioslib.provisioning.find({
				certs: { pem: pem },
				deviceUDIDs: device
			}, function (err, found) {
				if (err) {
					done(err);
				} else {
					should(found).be.an.Array;
					should(found).be.length(matches);
					checkProfiles(found);
					done();
				}
			});
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('watch for changes for 10 seconds', function (done) {
		this.timeout(80000);
		this.slow(80000);

		ioslib.provisioning.watch(function (err, results) {
			should(results).be.an.Object;
		});

		setTimeout(function () {
			ioslib.certs.unwatch();
			done();
		}, 10000);
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('stop watching for updates', function (done) {
		this.timeout(80000);
		this.slow(80000);

		var counter = 0;

		ioslib.provisioning.watch(function (err, results) {
			should(results).be.an.Object;
			if (++counter > 1) {
				done(new Error('Watcher event was fired despite unwatching'));
			}
		});

		setTimeout(function () {
			ioslib.certs.unwatch();
			setTimeout(function () {
				done();
			}, 2000);
		}, 2000);
	});

	// TODO: malformed provisioning profile?
});
