/**
 * Detects the Xcode and iOS development environment and its dependencies.
 *
 * This code has been deprecated and is only used to support Titanium SDKs
 * 3.1.X and older. Starting with Titanium SDK 3.2, the Xcode and iOS
 * detection code has been moved to lib/detect.js in the iOS platform repo.
 *
 * @module ios
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var child_process = require('child_process'),
	exec = child_process.exec,
	spawn = child_process.spawn,
	async = require('async'),
	path = require('path'),
	util = require('./util'),
	exception = require('./exception'),
	fs = require('fs'),
	afs = require('./fs'),
	plist = require('./plist'),
	version = require('./version'),
	cached;

/**
 * Detects the iOS development environment.
 * @param {Function} finished - The callback to fire when the detection is complete
 * @param {Object} [opts] - iOS detection options
 * @param {Object} [opts.minSDK] - The minimum iOS SDK to return
 */
exports.detect = function detect(finished, opts) {
	if (process.platform != 'darwin') return finished();
	if (cached) return finished(cached);

	opts = opts || {};

	async.parallel([
		function (callback) {
			var searchDirs = ['/Developer'],
				xcodeInfo = {},
				xcodeBuildTasks = [];

			// first we build up a full list of places to check for xcodebuild
			fs.statSync('/Applications').isDirectory() && fs.readdirSync('/Applications').forEach(function (dir) {
				fs.existsSync('/Applications/' + dir + '/Contents/Developer') && /^Xcode.*\.app$/.test(dir) && searchDirs.push('/Applications/' + dir + '/Contents/Developer');
			});

			// TODO: try to use spotlight to find additional Xcode locations: "mdfind kMDItemDisplayName==Xcode&&kMDItemKind==Application"

			exec('xcode-select -print-path', function (err, stdout, stderr) {
				var selected = err ? '' : stdout.trim(),
					sdkRegExp = /^iPhone(OS|Simulator)(.+)\.sdk$/;

				searchDirs.indexOf(selected) == -1 && searchDirs.push(selected);

				function getSDKs() {
					var dir = path.join.apply(null, Array.prototype.slice.call(arguments)),
						vers = [];

					fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (d) {
						var file = path.join(dir, d);
						if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
							var m = d.match(sdkRegExp);
							if (m && (!opts.minSDK || appc.version.gte(m[2], opts.minSDK))) {
								var ver = m[2];
								file = path.join(file, 'System', 'Library', 'CoreServices', 'SystemVersion.plist');
								if (fs.existsSync(file)) {
									var p = new plist(file);
									if (p.ProductVersion) {
										ver = p.ProductVersion;
									}
								}
								vers.push(ver);
							}
						}
					});

					return vers;
				}

				async.parallel(searchDirs.sort().map(function (dir) {
					return function (cb) {
						var m = dir.match(/^(.+?\/Xcode.*\.app)\//),
							xcodeapp = m ? m[1] : path.join(dir, 'Applications', 'Xcode.app'),
							xcodebuild = path.join(dir, 'usr', 'bin', 'xcodebuild'),
							plistfile = path.join(path.dirname(dir), 'version.plist'),
							p, info, key;

						if (fs.existsSync(xcodebuild) && fs.existsSync(plistfile)) {
							p = new plist(plistfile);
							info = {
								path: dir,
								xcodeapp: xcodeapp,
								xcodebuild: xcodebuild,
								selected: dir == selected,
								version: p.CFBundleShortVersionString,
								build: p.ProductBuildVersion,
								sdks: null,
								sims: null
							};
							key = info.version + ':' + info.build;

							// if we already have this version of Xcode, ignore unless it's currently the selected version
							if (!xcodeInfo[key] || info.selected || dir <= xcodeInfo[key].path) {
								xcodeInfo[key] = info;
								info.selected && (xcodeInfo.__selected__ = info);
								info.sdks = getSDKs(dir, 'Platforms', 'iPhoneOS.platform', 'Developer', 'SDKs');
								info.sims = getSDKs(dir, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'SDKs');
							}
						}
						cb();
					};
				}), function () {
					callback(null, xcodeInfo);
				});
			});
		},

		function (callback) {
			var enc = require('./encoding'),
				child = spawn('security', ['dump-keychain']),
				out = [],
				err = [];

			child.stdout.on('data', function (data) {
				out.push(data.toString());
			});

			child.stderr.on('data', function (data) {
				err.push(data.toString());
			});

			child.on('exit', function (code) {
				var devNames = {},
					distNames = {},
					result = {
						keychains: {},
						wwdr: false
					};

				if (code) {
					result.error = new exception('Failed during "security dump-keychain"', err.join('').split('\n'));
				} else {
					out.join('').split('keychain: ').forEach(function (line) {
						var m = line.match(/"alis"<blob>=[^"]*"(?:(?:iPhone (Developer|Distribution)\: (.*))|(Apple Worldwide Developer Relations Certification Authority))"/);
						if (m) {
							if (m[3]) {
								result.wwdr = true;
							} else {
								var type = m[1].toLowerCase(),
									name = enc.decodeOctalUTF8(m[2]),
									keychain = line.match(/^\s*"(.+)"/);

								if (!devNames[name] && !distNames[name]) {
									if (keychain) {
										result.keychains[keychain[1]] || (result.keychains[keychain[1]] = {});
										result.keychains[keychain[1]][type] || (result.keychains[keychain[1]][type] = []);
										result.keychains[keychain[1]][type].push(name);
									}

									if (type == 'developer') {
										devNames[name] = 1;
									} else if (type == 'distribution') {
										distNames[name] = 1;
									}
								}
							}
						}
					});

					// sort the names
					Object.keys(result.keychains).forEach(function (kc) {
						result.keychains[kc].developer && result.keychains[kc].developer.sort();
						result.keychains[kc].distribution && result.keychains[kc].distribution.sort();
					});

					result.devNames = Object.keys(devNames).sort();
					result.distNames = Object.keys(distNames).sort();
				}

				callback(null, result);
			});
		},

		function (callback) {
			var dir = afs.resolvePath('~/Library/MobileDevice/Provisioning Profiles'),
				provisioningProfiles = {
					adhoc: [],
					enterprise: [],
					development: [],
					distribution: []
				};

			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (file) {
				if (fs.existsSync(path.join(dir, file)) && /.+\.mobileprovision$/.test(file)) {
					var contents = fs.readFileSync(path.join(dir, file)).toString(),
						i = contents.indexOf('<?xml'),
						j = contents.lastIndexOf('</plist>'),
						p,
						dest = 'development',
						appPrefix,
						entitlements;

					if (i != -1 && j != -1) {
						p = new plist().parse(contents.substring(i, j + 8));
						appPrefix = (p.ApplicationIdentifierPrefix || []).shift();
						entitlements = p.Entitlements || {};

						if (!p.ProvisionedDevices || !p.ProvisionedDevices.length) {
							dest = 'distribution';
						} else if (new Buffer(p.DeveloperCertificates[0].value, 'base64').toString().indexOf('Distribution:') != -1) {
							dest = 'adhoc';
						}

						provisioningProfiles[dest].push({
							uuid: p.UUID,
							name: p.Name,
							appPrefix: appPrefix,
							appId: (entitlements['application-identifier'] || '').replace(appPrefix + '.', ''),
							getTaskAllow: entitlements['get-task-allow'] || false,
							apsEnvironment: entitlements['aps-environment'] || ''
						});
					}
				}
			});

			callback(null, provisioningProfiles);
		},

		function (callback) {
			var result = [];
			exec('security list-keychains', function (err, stdout, stderr) {
				if (!err) {
					result = result.concat(stdout.split('\n').filter(function (line) {
						var m = line.match(/[^"]*"([^"]*)"/);
						m && result.push(m[1].trim());
					}));
				}
			});
			callback(null, result);
		}

	], function (err, results) {
		finished(cached = {
			xcode: results[0],
			certs: results[1],
			provisioningProfiles: results[2],
			keychains: results[3]
		});
	});
};
