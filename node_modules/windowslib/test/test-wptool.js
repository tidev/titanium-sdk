/**
 * Tests windowslib's wptool module.
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

describe('wptool', function () {
	it('namespace should be an object', function () {
		should(windowslib.wptool).be.an.Object;
	});

	(process.platform === 'win32' ? it : it.skip)('should enumerate all Windows Phone devices and emulators', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.wptool.enumerate(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;

			function checkDevices(devs) {
				should(devs).be.an.Array;

				devs.forEach(function (d) {
					should(d).be.an.Object;
					should(d).have.ownProperty('name');
					should(d).have.ownProperty('udid');
					should(d).have.ownProperty('index');
					should(d).have.ownProperty('wpsdk');

					should(d.name).be.a.String;
					should(d.name).not.equal('');

					should(d.index).be.an.Integer;
				});
			}

			Object.keys(results).forEach(function (wpsdk) {
				should(results[wpsdk]).be.an.Object;
				should(results[wpsdk]).have.keys('devices', 'emulators');

				checkDevices(results[wpsdk].devices);
				checkDevices(results[wpsdk].emulators);
			});

			done();
		});
	});

	it('should not connect to a device with a bad udid', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.wptool.connect('bad udid', function (err) {
			if (err) {
				done();
			} else {
				done(new Error('Expected udid 100 to be invalid'));
			}
		}).on('error', function () {}); // squelch mocha
	});

	(process.platform === 'win32' ? it : it.skip)('should connect to a device with a valid udid', function (done) {
		this.timeout(10000);
		this.slow(9000);

		windowslib.wptool.connect('0', function (err) {
			done(err);
		}).on('error', function () {}); // squelch mocha
	});
});
