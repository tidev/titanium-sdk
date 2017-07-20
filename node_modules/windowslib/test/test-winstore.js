/**
 * Tests windowslib's windows module.
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
	windowslib = require('..');

describe('winstore', function () {
	it('namespace should be an object', function () {
		should(windowslib.winstore).be.an.Object;
	});

	it.skip('launch should launch Windows Store App', function (done) {
		this.timeout(10000);
		this.slow(2000);

		var appid = 'com.appcelerator.launch.test',
			opts  = { windowsAppId: 'App' };

		windowslib.winstore.launch(appid, opts, done);
	});

	// TODO Add tests for launch, install, uninstall, loopbackExempt

	(process.platform === 'win32' ? it : it.skip)('getAppxPackages should have preset Windows packages', function (done) {
		this.timeout(10000);
		this.slow(1250);

		windowslib.winstore.getAppxPackages({}, function (err, packages) {
			if (err) {
				return done(err);
			}

			should(packages).be.an.Object;
			// Assume user didn't somehow remove Edge browser and alarms apps
			should(packages).have.properties('Microsoft.MicrosoftEdge', 'Microsoft.WindowsAlarms');

			// all apps should have same base set of keys
			Object.keys(packages).forEach(function (appid) {
				should(packages[appid]).have.properties('Name', 'Publisher',
					'Architecture', 'Version', 'PackageFullName', 'IsFramework',
					'PackageFamilyName', 'PublisherId', 'IsResourcePackage',
					'IsBundle', 'IsDevelopmentMode');
				// may also have Installocation, ResourceId, Dependencies
				// check types of values are what we expect
				should(packages[appid].Name).be.a.String;
				should(packages[appid].Publisher).be.a.String;
				should(packages[appid].Architecture).be.a.String;
				should(packages[appid].Version).be.a.String;
				should(packages[appid].PackageFullName).be.a.String;
				should(packages[appid].IsFramework).be.a.Boolean;
				should(packages[appid].PackageFamilyName).be.a.String;
				should(packages[appid].PublisherId).be.a.String;
				should(packages[appid].IsResourcePackage).be.a.Boolean;
				should(packages[appid].IsBundle).be.a.Boolean;
				should(packages[appid].IsDevelopmentMode).be.a.Boolean;
			});

			// sanity check some values for Edge Browser app
			should(packages['Microsoft.MicrosoftEdge'].Publisher).equal('CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US');
			should(packages['Microsoft.MicrosoftEdge'].Name).equal('Microsoft.MicrosoftEdge');

			// sanity check some values for Alarms app
			should(packages['Microsoft.WindowsAlarms'].Publisher).equal('CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US');
			should(packages['Microsoft.WindowsAlarms'].Name).equal('Microsoft.WindowsAlarms');

			// check multiline value, can't guarantee ordering of depencencies and sometimes ends with ...
			// So we check start and ends with curly braces and contains specific depencencies we know
			should(packages['Microsoft.Windows.Photos'].Dependencies).startWith('{').and.endWith('}');

			var photosVersion = packages['Microsoft.Windows.Photos'].Version;
			if (photosVersion === '17.425.10010.0') {
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.VCLibs.140.00_14.0.24123.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.NET.Native.Framework.1.3_1.3.24201.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.NET.Native.Runtime.1.4_1.4.24201.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.Windows.Photos_17.425.10010.0_neutral_split.scale-100_8wekyb3d8bbwe');
			} else if (photosVersion === '17.313.10010.0') {
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.VCLibs.140.00_14.0.24123.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.NET.Native.Framework.1.3_1.3.24201.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.NET.Native.Runtime.1.3_1.3.23901.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.Windows.Photos_17.313.10010.0_neutral_split.scale-100_8wekyb3d8bbwe');
			} else if (photosVersion === '16.201.11370.0') {
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.VCLibs.140.00_14.0.22929.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.NET.Native.Runtime.1.1_1.1.23406.0_x64__8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.Windows.Photos_16.201.11370.0_neutral_split.scale-100_8wekyb3d8bbwe');
				should(packages['Microsoft.Windows.Photos'].Dependencies).containEql('Microsoft.Windows.Photos_16.201.11370.0_neutral_split.scale-150_8wekyb3d8bbwe');
			} else {
				console.log('Unknown Microsoft.Photos app version, not attempting to verify dependency listing!');
			}
			done();
		});
	});

	(process.platform === 'win32' ? it : it.skip)('detect should find Windows Store SDK installations', function (done) {
		this.timeout(5000);
		this.slow(2000);

		windowslib.winstore.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('windows', 'issues');

			if (results.windows !== null) {
				should(results.windows).be.an.Object;
				Object.keys(results.windows).forEach(function (ver) {
					should(results.windows[ver]).be.an.Object;
					should(results.windows[ver]).have.keys('version', 'registryKey', 'supported', 'path', 'signTool', 'selected', 'makeCert', 'pvk2pfx', 'sdks');

					should(results.windows[ver].version).be.a.String;
					should(results.windows[ver].version).not.equal('');

					should(results.windows[ver].registryKey).be.a.String;
					should(results.windows[ver].registryKey).not.equal('');

					should(results.windows[ver].supported).be.a.Boolean;

					should(results.windows[ver].path).be.a.String;
					should(results.windows[ver].path).not.equal('');
					should(fs.existsSync(results.windows[ver].path)).be.ok;

					if (results.windows[ver].signTool !== null) {
						should(results.windows[ver].signTool).be.an.Object;
						should(results.windows[ver].signTool.x86).be.a.String;
					}

					should(results.windows[ver].selected).be.a.Boolean;
				});
			}

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
});
