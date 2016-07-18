/**
 * Tests ioslib's teams module.
 *
 * @copyright
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const ioslib = require('..');

describe('teams', function () {
	it('namespace should be an object', function () {
		should(ioslib.teams).be.an.Object;
	});

	it('detect teams', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.teams.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			validateResults(results);
			done();
		});
	});

	it('return a emitter', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.teams.detect({ bypassCache: true })
			.on('detected', function (results) {
				validateResults(results);
				done();
			})
			.on('error', done);
	});
});

function validateResults(results) {
	should(results).be.an.Object;
	should(results).have.keys('teams');
	should(results.teams).be.an.Array;

	results.teams.forEach(function (team) {
		should(team).be.an.Object;
		should(team).have.keys('id', 'name');
		should(team.id).be.a.String;
		should(team.id).not.equal('');
		should(team.name).be.a.String;
		should(team.name).not.equal('');
	});
}
