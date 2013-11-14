/**
 * Detects the Xcode and iOS development environment and its dependencies.
 *
 * @module lib/detect
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	async = require('async'),
	spawn = require('child_process').spawn,
	appc = require('node-appc'),
	iosDevice = require('node-ios-device'),
	pki = require('node-forge')({disableNativeCode: true}).pki,
	iosPackageJson = appc.pkginfo.package(module),
	manifestJson = appc.pkginfo.manifest(module),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	encoding = appc.encoding,
	version = appc.version,
	run = appc.subprocess.run,
	findExecutable = appc.subprocess.findExecutable,
	envCache;

/**
 * Detects current Xcode and iOS environment.
 * @param {Object} config - The CLI config object
 * @param {Object} opts - Detection options; currently only 'bypassCache'
 * @param {Function} finished - Callback when detection is finished
 */
exports.detect = function detect(config, opts, finished) {
	opts = opts || {};

	if (process.platform != 'darwin') return finished();
	if (envCache && !opts.bypassCache) return finished(envCache);

	var issues = [];

	// first we find all the executables we're going to be calling
	async.parallel({
		xcodeSelect: function (next) {
			findExecutable([config.get('osx.executables.xcodeSelect'), 'xcode-select'], function (err, result) {
				err && issues.push({
					id: 'IOS_XCODE_SELECT_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'xcode-select' executable") + '\n'
						+ __('Perhaps Xcode is not installed, your Xcode installation is corrupt, or your system path is incomplete.') + '\n'
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config osx.executables.xcodeSelect /path/to/xcode-select'.")
				});
				next(null, result);
			});
		},

		security: function (next) {
			findExecutable([config.get('osx.executables.security'), 'security'], function (err, result) {
				err && issues.push({
					id: 'IOS_SECURITY_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'security' executable") + '\n'
						+ __('Please verify your system path.') + '\n'
						+ __("This program is distributed with Mac OS X and if it's missing, you'll have to restore it from a backup or another computer, or reinstall Mac OS X.")
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config osx.executables.security /path/to/security'.")
				});
				next(null, result);
			});
		}

	}, function (err, executables) {
		async.parallel({
			// find all xcode installations
			xcode: function (done) {
				var searchPaths = ['/Developer'];

				// add the xcode paths from the cli config
				var xcodePaths = config.get('paths.xcode');
				Array.isArray(xcodePaths) && xcodePaths.forEach(function (p) {
					p = afs.resolvePath(p);
					if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
						// check if the path is to the Xcode.app dir
						if (!/.+\/Contents\/Developer$/.test(p)) {
							// yep, we need to add the /Contents/Developer
							var q = path.join(p, 'Contents', 'Developer');
							if (fs.existsSync(q)) {
								// looks good
								p = q;
							} else {
								// OK, so not a Xcode directory, but maybe it contains an Xcode directory
								fs.readdirSync(p).forEach(function (dir) {
									var r = path.join(p, dir, 'Contents', 'Developer');
									if (fs.existsSync(r) && /^Xcode.*\.app$/.test(dir) && searchPaths.indexOf(r) == -1) {
										searchPaths.push(r);
									}
								});
								return;
							}
						}
						if (fs.existsSync(p) && searchPaths.indexOf(p) == -1) {
							searchPaths.push(p);
						}
					}
				});

				// first we build up a full list of places to check for xcodebuild
				fs.statSync('/Applications').isDirectory() && fs.readdirSync('/Applications').forEach(function (dir) {
					var p = '/Applications/' + dir + '/Contents/Developer';
					if (fs.existsSync(p) && /^Xcode.*\.app$/.test(dir) && searchPaths.indexOf(p) == -1) {
						searchPaths.push(p);
					}
				});

				function findXcodes(selectedXcodePath) {
					if (selectedXcodePath && searchPaths.indexOf(selectedXcodePath) == -1) {
						searchPaths.push(selectedXcodePath);
					}

					var sdkRegExp = /^iPhone(OS|Simulator)(.+)\.sdk$/,
						findIosSdks = function (dir) {
							var vers = [];
							fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (d) {
								var file = path.join(dir, d);
								if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
									var m = d.match(sdkRegExp);
									if (m && (!opts.minSDK || appc.version.gte(m[2], opts.minSDK))) {
										var ver = m[2];
										file = path.join(file, 'System', 'Library', 'CoreServices', 'SystemVersion.plist');
										if (fs.existsSync(file)) {
											var p = new appc.plist(file);
											if (p.ProductVersion) {
												ver = p.ProductVersion;
											}
										}
										vers.push(ver);
									}
								}
							});
							return vers;
						};

					var xcodeInstalls = {};
					async.parallel(searchPaths.sort().map(function (dir) {
						return function (cb) {
							var m = dir.match(/^(.+?\/Xcode.*\.app)\//),
								xcodeapp = m ? m[1] : path.join(dir, 'Applications', 'Xcode.app'),
								xcodebuild = path.join(dir, 'usr', 'bin', 'xcodebuild'),
								plistfile = path.join(path.dirname(dir), 'version.plist'),
								p, info, key;

							if (fs.existsSync(xcodebuild) && fs.existsSync(plistfile)) {
								p = new appc.plist(plistfile);
								info = {
									path: dir,
									xcodeapp: xcodeapp,
									xcodebuild: xcodebuild,
									selected: dir == selectedXcodePath,
									version: p.CFBundleShortVersionString,
									build: p.ProductBuildVersion,
									supported: appc.version.satisfies(p.CFBundleShortVersionString, iosPackageJson.vendorDependencies.xcode, true),
									sdks: null,
									sims: null
								};
								key = info.version + ':' + info.build;

								// if we already have this version of Xcode, ignore unless it's currently the selected version
								if (!xcodeInstalls[key] || info.selected || dir <= xcodeInstalls[key].path) {
									if (info.supported == false) {
										issues.push({
											id: 'IOS_XCODE_TOO_OLD',
											type: 'warning',
											message: __('Xcode %s is too old and is no longer supported by Titanium SDK %s.', '__' + info.version + '__', manifestJson.version) + '\n' +
												__('The minimumm supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, appc.version.parseMin(iosPackageJson.vendorDependencies.xcode))
										});
									} else if (info.supported == 'maybe') {
										issues.push({
											id: 'IOS_XCODE_TOO_NEW',
											type: 'warning',
											message: __('Xcode %s is too new and may or may not work with Titanium SDK %s.', '__' + info.version + '__', manifestJson.version) + '\n' +
												__('The maximum supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, appc.version.parseMax(iosPackageJson.vendorDependencies.xcode)) + '\n'
										});
									}

									xcodeInstalls[key] = info;
									info.sdks = findIosSdks(path.join(dir, 'Platforms', 'iPhoneOS.platform', 'Developer', 'SDKs'));
									info.sims = findIosSdks(path.join(dir, 'Platforms', 'iPhoneSimulator.platform', 'Developer', 'SDKs'));
								}
							}
							cb();
						};
					}), function () {
						if (Object.keys(xcodeInstalls).length) {
							var validXcodes = 0,
								sdkCounter = 0,
								simCounter = 0;

							Object.keys(xcodeInstalls).forEach(function (x) {
								if (xcodeInstalls[x].supported) {
									// we're counting maybe's as valid
									validXcodes++;
								}
								if (xcodeInstalls[x].sdks) {
									sdkCounter += xcodeInstalls[x].sdks.length;
								}
								if (xcodeInstalls[x].sims) {
									simCounter += xcodeInstalls[x].sims.length;
								}
							});

							if (!validXcodes) {
								issues.push({
									id: 'IOS_NO_SUPPORTED_XCODE_FOUND',
									type: 'warning',
									message: __('There are no Xcode installations found that are supported by Titanium SDK %s.', manifestJson.version)
								});
							}

							if (!sdkCounter) {
								issues.push({
									id: 'IOS_NO_IOS_SDKS',
									type: 'error',
									message: __('There are no iOS SDKs found') + '\n' +
										__('Launch Xcode and download the mobile support packages.')
								});
							}

							if (!sdkCounter) {
								issues.push({
									id: 'IOS_NO_IOS_SIMS',
									type: 'error',
									message: __('There are no iOS Simulators found') + '\n' +
										__('You can install them from the Xcode Preferences > Downloads tab.')
								});
							}
						} else {
							issues.push({
								id: 'IOS_XCODE_NOT_INSTALLED',
								type: 'error',
								message: __('No Xcode installations found.') + '\n' +
									__('You can download it from the %s or from %s.',
										'__App Store__',
										'__https://developer.apple.com/xcode/__')
							});
						}
						done(null, xcodeInstalls);
					});
				}

				if (executables.xcodeSelect) {
					run(executables.xcodeSelect, '--print-path', function (err, stdout, stderr) {
						findXcodes(err ? null : stdout.trim());
					});
				} else {
					findXcodes();
				}
			},

			certs: function (done) {
				var result = {
						keychains: {},
						wwdr: false
					},
					check = function () {
						if (!result.wwdr) {
							issues.push({
								id: 'IOS_NO_WWDR_CERT_FOUND',
								type: 'error',
								message: __('Apple’s World Wide Developer Relations (WWDR) intermediate certificate is not installed.') + '\n' +
									__('This will prevent you from building apps for iOS devices or package for distribution.') + '\n' +
									__('Download and install the certificate from %s', '__http://appcelerator.com/ios-wwdr__')
							});
						}

						if (!Object.keys(result.keychains).length) {
							// I don't think this is even possible
							issues.push({
								id: 'IOS_NO_KEYCHAINS_FOUND',
								type: 'warning',
								message: __('Unable to find any keychains found.') + '\n' +
									__('Titanium will most likely not be able to detect any developer or distribution certificates.')
							});
						}

						var validDevCerts = 0,
							validDistCerts = 0;

						Object.keys(result.keychains).forEach(function (keychain) {
							var k = result.keychains[keychain];

							k.developer && k.developer.forEach(function (d) {
								if (!d.invalid) {
									validDevCerts++;
								}
							});

							k.distribution && k.distribution.forEach(function (d) {
								if (!d.invalid) {
									validDistCerts++;
								}
							});
						});

						if (!validDevCerts) {
							issues.push({
								id: 'IOS_NO_VALID_DEV_CERTS_FOUND',
								type: 'warning',
								message: __('Unable to find any valid iOS developer certificates.') + '\n' +
									__('This will prevent you from building apps for iOS devices.') + '\n' +
									__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
										'__http://appcelerator.com/ios-dev-certs__')
							});
						}

						if (!validDistCerts) {
							issues.push({
								id: 'IOS_NO_VALID_DIST_CERTS_FOUND',
								type: 'warning',
								message: __('Unable to find any valid iOS production distribution certificates.') + '\n' +
									__('This will prevent you from packaging apps for distribution.') + '\n' +
									__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
										'__http://appcelerator.com/ios-dist-certs__')
							});
						}

						done(null, result);
					};

				// if we didn't find the 'security' program, then proceed
				if (!executables.security) {
					return check();
				}

				// get all keychains and certs
				run(executables.security, 'list-keychains', function (code, out, err) {
					if (code) return check();

					var begin = '-----BEGIN CERTIFICATE-----',
						iphoneDev = 'iPhone Developer:',
						iphoneDist = 'iPhone Distribution:',
						now = new Date,
						tasks = [];

					// parse out the keychains and add tasks to find certs for each keychain
					out.split('\n').forEach(function (line) {
						var m = line.match(/[^"]*"([^"]*)"/);
						if (m) {
							var keychain = m[1].trim(),
								dest = result.keychains[keychain] = {};

							// find all the developer certificates in this keychain
							tasks.push(function (next) {
								run(executables.security, ['find-certificate', '-c', iphoneDev, '-a', '-p', keychain], function (code, out, err) {
									if (code) return next();

									out.trim().split(begin).forEach(function (c, i) {
										if (!i) return; // skip first element because it's empty from the split
										var cert = pki.certificateFromPem(begin + c),
											expired = cert.validity.notAfter < now,
											invalid = expired || cert.validity.notBefore > now;

										dest.developer || (dest.developer = []);

										dest.developer.push({
											name: cert.subject.getField('CN').value.substring(iphoneDev.length).trim(),
											before: cert.validity.notBefore,
											after: cert.validity.notAfter,
											expired: expired,
											invalid: invalid
										});
									});

									next();
								});
							});

							// find all the distribution certificates in this keychain
							tasks.push(function (next) {
								run(executables.security, ['find-certificate', '-c', iphoneDist, '-a', '-p', keychain], function (code, out, err) {
									if (code) return next();

									out.trim().split(begin).forEach(function (c, i) {
										if (!i) return; // skip first element because it's empty from the split
										var cert = pki.certificateFromPem(begin + c),
											expired = cert.validity.notAfter < now,
											invalid = expired || cert.validity.notBefore > now;

										dest.distribution || (dest.distribution = []);

										dest.distribution.push({
											name: cert.subject.getField('CN').value.substring(iphoneDist.length).trim(),
											before: cert.validity.notBefore,
											after: cert.validity.notAfter,
											expired: expired,
											invalid: invalid
										});
									});

									next();
								});
							});

							// find all the wwdr certificates in this keychain
							tasks.push(function (next) {
								if (result.wwdr) return next();

								run(executables.security, ['find-certificate', '-c', 'Apple Worldwide Developer Relations Certification Authority', '-a', '-p', keychain], function (code, out, err) {
									if (code) return next();

									out.trim().split(begin).forEach(function (c, i) {
										if (!i) return; // skip first element because it's empty from the split
										var cert = pki.certificateFromPem(begin + c),
											invalid = cert.validity.notAfter < now || cert.validity.notBefore > now;
										if (!invalid) {
											result.wwdr = true;
										}
									});

									next();
								});
							});
						}
					});

					// process all cert tasks
					async.parallel(tasks, check);
				});
			},

			provisioningProfiles: function (done) {
				var dir = afs.resolvePath('~/Library/MobileDevice/Provisioning Profiles'),
					provisioningProfiles = {
						development: [],
						adhoc: [],
						distribution: []
					},
					valid = {
						development: 0,
						adhoc: 0,
						distribution: 0
					};

				fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (file) {
					if (fs.existsSync(path.join(dir, file)) && /.+\.mobileprovision$/.test(file)) {
						var contents = fs.readFileSync(path.join(dir, file)).toString(),
							i = contents.indexOf('<?xml'),
							j = contents.lastIndexOf('</plist>'),
							p,
							dest = 'development',
							appPrefix,
							entitlements,
							expired = false;

						if (i != -1 && j != -1) {
							p = new appc.plist().parse(contents.substring(i, j + 8));
							appPrefix = (p.ApplicationIdentifierPrefix || []).shift();
							entitlements = p.Entitlements || {};

							if (!p.ProvisionedDevices || !p.ProvisionedDevices.length) {
								dest = 'distribution';
							} else if (new Buffer(p.DeveloperCertificates[0].value, 'base64').toString().indexOf('Distribution:') != -1) {
								dest = 'adhoc';
							}

							try {
								if (p.ExpirationDate) {
									expired = new Date(p.ExpirationDate) < new Date;
								}
							} catch (e) {}

							if (!expired) {
								valid[dest]++;
							}

							provisioningProfiles[dest].push({
								uuid: p.UUID,
								name: p.Name,
								appPrefix: appPrefix,
								creationDate: p.CreationDate,
								expirationDate: p.ExpirationDate,
								expired: expired,
								appId: (entitlements['application-identifier'] || '').replace(appPrefix + '.', ''),
								getTaskAllow: entitlements['get-task-allow'] || '',
								apsEnvironment: entitlements['aps-environment'] || ''
							});
						}
					}
				});

				if (!provisioningProfiles.development.length || !valid.development) {
					issues.push({
						id: 'IOS_NO_VALID_DEVELOPMENT_PROVISIONING_PROFILES',
						type: 'warning',
						message: __('Unable to find any valid iOS development provisioning profiles.') + '\n' +
							__('This will prevent you from building apps for testing on iOS devices.') + '\n' +
							__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
								'__http://appcelerator.com/ios-dev-certs__')
					});
				}

				if (!provisioningProfiles.adhoc.length || !valid.adhoc) {
					issues.push({
						id: 'IOS_NO_VALID_ADHOC_PROVISIONING_PROFILES',
						type: 'warning',
						message: __('Unable to find any valid iOS adhoc provisioning profiles.') + '\n' +
							__('This will prevent you from packaging apps for adhoc distribution.') + '\n' +
							__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
								'__http://appcelerator.com/ios-dist-certs__')
					});
				}

				if (!provisioningProfiles.distribution.length || !valid.distribution) {
					issues.push({
						id: 'IOS_NO_VALID_DISTRIBUTION_PROVISIONING_PROFILES',
						type: 'warning',
						message: __('Unable to find any valid iOS distribution provisioning profiles.') + '\n' +
							__('This will prevent you from packaging apps for AppStore distribution.') + '\n' +
							__('You will need to login into %s with your Apple Download account, then create, download, and install a profile.',
								'__http://appcelerator.com/ios-dist-certs__')
					});
				}

				done(null, provisioningProfiles);
			}

		}, function (err, results) {
			appc.util.mix(results, executables);

			results.detectVersion    = '2.0';
			results.issues           = issues;

			finished(envCache = results);
		});
	});

};

/**
 * Returns the iOS Simulator profiles.
 * @param {Object} config - The CLI config object
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} finished(err, results) - Callback when detection is finished
 */
exports.detectSimulators = function detectSimulators(config, opts, finished) {
	if (typeof opts == 'function') {
		finished = opts;
		opts = {};
	} else {
		opts = opts || {};
	}

	exports.detect(config, opts, function (info) {
		var file = path.join(__dirname, '..', '..', 'simulators.json'),
			results = [],
			sims = JSON.parse(fs.readFileSync(file)),
			sdks = {};

		Object.keys(info.xcode).forEach(function (ver) {
			info.xcode[ver].sims && info.xcode[ver].sims.forEach(function (sdk) {
				sdks[sdk] = 1;
			});
		});

		sdks = Object.keys(sdks).sort();

		Object.keys(sims).forEach(function (name) {
			var sim = sims[name],
				type = sim.type || 'iphone',
				_64bit = !!sim['64bit'],
				retina = !!sim.retina,
				tall = !!sim.tall,
				versions = {};

			if (!opts.type || opts.type == type) {
				// calculate the sdks
				sdks.forEach(function (sdk) {
					if (type == 'iphone' || (type == 'ipad' && version.gte(sdk, '3.0.0'))) {
						if (!_64bit || version.gte(sdk, '7.0.0')) {
							if (!tall || version.gte(sdk, '6.0.0')) {
								if ((!retina && type == 'ipad' || version.lt(sdk, '7.0.0')) || (retina && version.gte(sdk, '4.0.0'))) {
									versions[sdk] = 1;
								}
							}
						}
					}
				});

				versions = Object.keys(versions).sort();

				// if we don't have at least 1 simulator version that matches this profile, don't add it
				if (versions.length) {
					results.push({
						id: name,
						name: name,
						type: type,
						'64bit': _64bit,
						retina: retina,
						tall: tall,
						versions: versions
					});
				}
			}
		});

		finished(null, results);
	});
};

/**
 * Detects connected iOS devices.
 * @param {Function} finished - Callback when detection is finished
 */
exports.detectDevices = function detectDevices(finished) {
	iosDevice.devices(function (err, devices) {
		if (err) {
			finished(err);
		} else {
			devices.unshift({
				udid: 'itunes',
				name: __('iTunes Sync')
			});
			finished(null, devices.map(function (d) {
				d.id = d.udid;
				return d;
			}));
		}
	});
};
