/**
 * Tests windowslib's device module.
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
	path = require('path'),
	windowslib = require('..');

describe('device', function () {
	it('namespace should be an object', function () {
		should(windowslib.device).be.an.Object;
	});

	((process.env.JENKINS || process.platform !== 'win32') ? it.skip : it)('detect Windows Phone devices', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.device.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('devices', 'issues');

			should(results.devices).be.an.Array;
			results.devices.forEach(function (dev) {
				should(dev).be.an.Object;
				should(dev).have.properties('name', 'udid', 'index', 'wpsdk'); // may also have 'ip'

				should(dev.name).be.a.String;
				should(dev.name).not.equal('');

				should(dev.udid).be.a.Number;

				should(dev.index).be.a.Number;

				should(dev.wpsdk).not.be.ok;
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

	((process.env.JENKINS || process.platform !== 'win32') ? it.skip : it)('connect to a device', function (done) {
		this.timeout(120000);
		this.slow(110000);

		windowslib.device.connect(0, done);
	});

	((process.env.JENKINS || process.platform !== 'win32') ? it.skip : it)('install app on a device', function (done) {
		this.timeout(120000);
		this.slow(110000);

		windowslib.visualstudio.build({
			buildConfiguration: 'Debug',
			project: path.join(__dirname, 'TestApp', 'TestApp.csproj')
		}, function (err, result) {
			if (err) {
				return done(err);
			}

			var xapFile = path.join(__dirname, 'TestApp', 'Bin', 'Debug', 'TestApp_Debug_AnyCPU.xap');
			should(fs.existsSync(xapFile)).be.ok;

			windowslib.device.install(0, xapFile, function (err) {
				done(err);
			});
		});
	});
});
