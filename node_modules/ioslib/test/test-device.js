/**
 * Tests ioslib's device module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	exec = require('child_process').exec,
	fs = require('fs'),
	ioslib = require('..'),
	path = require('path');

function build(app, provisioningProfileUUID, certName, defs, done){
	if (typeof defs === 'function') {
		done = defs;
		defs = [];
	}

	ioslib.xcode.detect(function (err, env) {
		if (err) {
			return done(err);
		}

		if (env.selectedXcode === null) {
			return done(new Error(__('No selected Xcode')));
		}

		var cmd = [
			env.selectedXcode.executables.xcodebuild,
			'clean', 'build',
			'-configuration', 'Debug',
			'-sdk', 'iphoneos' + appc.version.format(env.selectedXcode.sdks[0], 2, 2),
			'VALID_ARCHS="armv7 armv7s"',
			'ARCHS="armv7 armv7s"',
			'IPHONEOS_DEPLOYMENT_TARGET=6.0',
			'PROVISIONING_PROFILE=' + provisioningProfileUUID,
			'DEPLOYMENT_POSTPROCESSING=YES',
			'CODE_SIGN_IDENTITY="' + certName + '"',
			'GCC_PREPROCESSOR_DEFINITIONS="' + defs.join(' ') + '"'
		].join(' ');

		exec(cmd, {
			cwd: path.join(__dirname, app)
		}, function (code, out, err) {
			should(out).match(/BUILD SUCCEEDED/);
			var appPath = path.join(__dirname, app, 'build', 'Debug-iphoneos', app + '.app');
			should(fs.existsSync(appPath)).be.true;
			done(null, appPath);
		});
	});
}

describe('device', function () {
	it('namespace should be an object', function () {
		should(ioslib.device).be.an.Object;
	});

	it('detect iOS devices', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.device.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('devices', 'issues');

			should(results.devices).be.an.Array;
			results.devices.forEach(function (dev) {
				should(dev).be.an.Object;
				should(dev).have.keys('udid', 'name', 'buildVersion', 'cpuArchitecture', 'deviceClass', 'deviceColor',
					'hardwareModel', 'modelNumber', 'productType', 'productVersion', 'serialNumber');

				should(dev.udid).be.a.String;
				should(dev.udid).not.equal('');

				should(dev.name).be.a.String;
				should(dev.name).not.equal('');

				should(dev.buildVersion).be.a.String;
				should(dev.buildVersion).not.equal('');

				should(dev.cpuArchitecture).be.a.String;
				should(dev.cpuArchitecture).not.equal('');

				should(dev.deviceClass).be.a.String;
				should(dev.deviceClass).not.equal('');

				should(dev.deviceColor).be.a.String;
				should(dev.deviceColor).not.equal('');

				should(dev.hardwareModel).be.a.String;
				should(dev.hardwareModel).not.equal('');

				should(dev.modelNumber).be.a.String;
				should(dev.modelNumber).not.equal('');

				should(dev.productType).be.a.String;
				should(dev.productType).not.equal('');

				should(dev.productVersion).be.a.String;
				should(dev.productVersion).not.equal('');

				should(dev.serialNumber).be.a.String;
				should(dev.serialNumber).not.equal('');
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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should fail to install app bad app path', function (done) {
		this.timeout(30000);
		this.slow(30000);

		ioslib.device.install(null, '/path/to/something/that/does/not/exist', 'foo', function (err) {
			should(err).be.an.instanceOf(Error);
			done();
		}).on('error', function (err) {
			should(err).be.an.instanceOf(Error);
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to install app to device', function (done) {
		this.timeout(60000);
		this.slow(60000);

		var appId = 'com.appcelerator.TestApp';

		// find us a device
		ioslib.findValidDeviceCertProfileCombos({
			appId: appId
		}, function (err, results) {
			function noop() {}

			if (err) {
				return done(err);
			}

			if (!results.length) {
				return done(new Error('No valid device/cert/provisioning profile combos found'));
			}

			build('TestApp', results[0].ppUUID, results[0].certName, ['TEST_BASIC_LOGGING'], function (err, appPath) {
				should(err).not.be.ok;
				should(appPath).be.a.String;
				should(fs.existsSync(appPath)).be.ok;

				var started = false,
					timer = null;

				ioslib.device.install(results[0].deviceUDID, appPath, appId, function (err) {
					should(err).not.be.ok;

					console.log('Please launch app. You have 10 seconds.');

					timer = setTimeout(function () {
						done(new Error(started ? "App started, but didn't produce any log output" : 'App was not started'));
						done = noop;
					}, 10000);
				}).on('app-started', function () {
					started = true;
				}).on('log', function (msg) {
					clearTimeout(timer);
					done();
					done = noop;
				}).on('error', function (err) {
					done(err);
					done = noop;
				});
			});
		});
	});
});
