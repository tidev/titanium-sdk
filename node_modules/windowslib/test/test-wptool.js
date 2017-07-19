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

	it('should parse Windows 10 WinAppDeployCmd.exe device listing output', function (done) {
		this.timeout(1000);
		this.slow(500);

		var output = 'Windows App Deployment Tool\r\nVersion 10.0.0.0\r\nCopyright (c) Microsoft Corporation. All rights reserved.\r\n\r\nDiscovering devices...\r\nIP Address      GUID                                    Model/Name\r\n127.0.0.1       00000045-8aab-6667-0000-000000000000    Windows Phone 8\r\n10.120.68.150   00000015-b21e-0da9-0000-000000000000    Lumia 1520 (RM-940)\r\n10.120.70.172   00000000-0000-0000-0000-00155d619532    00155D619532\r\nDone.';
		var devices = windowslib.wptool.test.parseWinAppDeployCmdListing(output);
		should(devices).be.an.Array;
		should(devices.length).equal(3); // 3 devices in listing


		devices.forEach(function (d) {
			should(d).be.an.Object;
			should(d).have.ownProperty('name');
			should(d).have.ownProperty('udid');
			should(d).have.ownProperty('index');
			should(d).have.ownProperty('wpsdk');
			should(d).have.ownProperty('ip');

			should(d.name).be.a.String;
			should(d.index).be.an.Integer;
			should(d.udid).be.a.String;
			should(d.ip).be.a.String;
		});

		// Windows Phone 8
		should(devices[0].name).equal('Windows Phone 8');
		should(devices[0].index).equal(0);
		should(devices[0].udid).equal('00000045-8aab-6667-0000-000000000000');
		should(devices[0].ip).equal('127.0.0.1');

		// Lumia 1520 (RM-940)
		should(devices[1].name).equal('Lumia 1520 (RM-940)');
		should(devices[1].index).equal(1);
		should(devices[1].udid).equal('00000015-b21e-0da9-0000-000000000000');
		should(devices[1].ip).equal('10.120.68.150');

		// 00155D619532
		should(devices[2].name).equal('00155D619532');
		should(devices[2].index).equal(2);
		should(devices[2].udid).equal('00000000-0000-0000-0000-00155d619532');
		should(devices[2].ip).equal('10.120.70.172');

		done();
	});

	it('should parse Windows 8.1 AppDeployCmd.exe emulator listing output', function (done) {
		this.timeout(1000);
		this.slow(500);

		var	wpsdk = '8.1', // Get the 8.1 emulators from the output
			output = '\r\n' +
				'Device Index    Device Name\r\n' +
				'------------    -------------------------------\r\n' +
				' 0              Device\r\n' +
				' 1              Mobile Emulator 10.0.10586.0 WVGA 4 inch 512MB\r\n' +
				' 2              Mobile Emulator 10.0.10586.0 WVGA 4 inch 1GB\r\n' +
				' 3              Mobile Emulator 10.0.10586.0 WXGA 4.5 inch 1GB\r\n' +
				' 4              Mobile Emulator 10.0.10586.0 720p 5 inch 1GB\r\n' +
				' 5              Mobile Emulator 10.0.10586.0 1080p 6 inch 2GB\r\n' +
				' 6              Mobile Emulator 10.0.10586.0 QHD 5.2 inch 3GB\r\n' +
				' 7              Emulator 8.1 U1 WVGA 4 inch 512MB\r\n' +
				' 8              Emulator 8.1 U1 WVGA 4 inch\r\n' +
				' 9              Emulator 8.1 U1 WXGA 4.5 inch\r\n' +
				' 10             Emulator 8.1 U1 720P 4.7 inch\r\n' +
				' 11             Emulator 8.1 U1 1080P 5.5 inch\r\n' +
				' 12             Emulator 8.1 U1 1080P 6 inch\r\n' +
				' 13             Emulator 8.1 U1 qHD 5 inch\r\n' +
				' 14             Emulator 8.1 WVGA 4 inch 512MB\r\n' +
				' 15             Emulator 8.1 WVGA 4 inch\r\n' +
				' 16             Emulator 8.1 WXGA 4.5 inch\r\n' +
				' 17             Emulator 8.1 720P 4.7 inch\r\n' +
				' 18             Emulator 8.1 1080P 5.5 inch\r\n' +
				' 19             Emulator 8.1 1080P 6 inch\r\n' +
				'Done.';
		var emulators = windowslib.wptool.test.parseAppDeployCmdListing(output, wpsdk);
		should(emulators).be.an.Array;
		should(emulators.length).equal(13); // 13 8.1 emulators in listing, we filter out the 10.0 emulators

		// TODO Verify name and udid matches the listing above
		emulators.forEach(function (e) {
			should(e).be.an.Object;
			should(e).have.ownProperty('name');
			should(e).have.ownProperty('udid');
			should(e).have.ownProperty('index');
			should(e).have.ownProperty('wpsdk');

			should(e.name).be.a.String;
			should(e.name).not.equal('');

			should(e.index).be.an.Integer;

			should(e.wpsdk).equal(wpsdk);
		});

		done();
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

	((process.env.JENKINS || process.platform !== 'win32') ? it.skip : it)('should connect to a device with a valid udid', function (done) {
		this.timeout(10000);
		this.slow(9000);

		windowslib.wptool.connect('0', function (err) {
			done(err);
		}).on('error', function () {}); // squelch mocha
	});
});
