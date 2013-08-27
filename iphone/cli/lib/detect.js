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
	iosPackageJson = appc.pkginfo.package(module),
	manifestJson = appc.pkginfo.manifest(module),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	encoding = appc.encoding,
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
			findExecutable([config.get('ios.executables.xcodeSelect'), 'xcode-select'], function (err, result) {
				err && issues.push({
					id: 'IOS_XCODE_SELECT_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'xcode-select' executable") + '\n'
						+ __('Perhaps Xcode is not installed, your Xcode installation is corrupt, or your system path is incomplete.') + '\n'
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config ios.xcodeSelect /path/to/xcode-select'.")
				});
				next(null, result);
			});
		},

		pkgutil: function (next) {
			findExecutable([config.get('ios.executables.pkgutil'), 'pkgutil'], function (err, result) {
				err && issues.push({
					id: 'IOS_PKGUTIL_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'pkgutil' executable") + '\n'
						+ __('Please verify your system path.') + '\n'
						+ __("This program is distributed with Mac OS X and if it's missing, you'll have to restore it from a backup or another computer, or reinstall Mac OS X.")
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config ios.pkgutil /path/to/pkgutil'.")
				});
				next(null, result);
			});
		},

		security: function (next) {
			findExecutable([config.get('ios.executables.security'), 'security'], function (err, result) {
				err && issues.push({
					id: 'IOS_SECURITY_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'security' executable") + '\n'
						+ __('Please verify your system path.') + '\n'
						+ __("This program is distributed with Mac OS X and if it's missing, you'll have to restore it from a backup or another computer, or reinstall Mac OS X.")
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config ios.security /path/to/security'.")
				});
				next(null, result);
			});
		},

		openssl: function (next) {
			findExecutable([config.get('ios.executables.openssl'), 'openssl'], function (err, result) {
				err && issues.push({
					id: 'IOS_OPENSSL_EXECUTABLE_NOT_FOUND',
					type: 'error',
					message: __("Unable to find the 'openssl' executable") + '\n'
						+ __('Please verify your system path.') + '\n'
						+ __("This program should be distributed with Mac OS X and if it's missing, you can download from http://www.openssl.org/.")
						+ __("If you know where this executable is, you can tell the Titanium CLI where it located by running 'titanium config ios.openssl /path/to/openssl'.")
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
					if (afs.exists(p) && fs.statSync(p).isDirectory()) {
						// check if the path is to the Xcode.app dir
						if (!/.+\/Contents\/Developer$/.test(p)) {
							// yep, we need to add the /Contents/Developer
							var q = path.join(p, 'Contents', 'Developer');
							if (afs.exists(q)) {
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
						if (afs.exists(p) && searchPaths.indexOf(p) == -1) {
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
							afs.exists(dir) && fs.readdirSync(dir).forEach(function (d) {
								var file = path.join(dir, d);
								if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
									var m = d.match(sdkRegExp);
									m && (!opts.minSDK || appc.version.gte(m[2], opts.minSDK)) && vers.push(m[2]);
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

							if (afs.exists(xcodebuild) && afs.exists(plistfile)) {
								p = new appc.plist(plistfile);
								info = {
									path: dir,
									xcodeapp: xcodeapp,
									xcodebuild: xcodebuild,
									selected: dir == selectedXcodePath,
									version: p.CFBundleShortVersionString,
									build: p.ProductBuildVersion,
									supported: appc.version.gte(p.CFBundleShortVersionString, iosPackageJson.minXcodeVersion)
										? (appc.version.lt(p.CFBundleShortVersionString, iosPackageJson.maxXcodeVersion + '.9999') ? true : 'maybe') : false,
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
												__('The minimumm supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, iosPackageJson.minXcodeVersion)
										});
									} else if (info.supported == 'maybe') {
										issues.push({
											id: 'IOS_XCODE_TOO_NEW',
											type: 'warning',
											message: __('Xcode %s is too new and may or may not work with Titanium SDK %s.', '__' + info.version + '__', manifestJson.version) + '\n' +
												__('The maximum supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, iosPackageJson.maxXcodeVersion) + '\n'
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
							var validXcodes = 0;
							Object.keys(xcodeInstalls).forEach(function (x) {
								if (xcodeInstalls[x].supported) {
									// we're counting maybe's as valid
									validXcodes++;
								}
							});
							if (!validXcodes) {
								issues.push({
									id: 'IOS_NO_SUPPORTED_XCODE_FOUND',
									type: 'warning',
									message: __('There are no Xcode installations found that are supported by Titanium SDK %s.', manifestJson.version)
								});
							}
						} else {
							issues.push({
								id: 'IOS_XCODE_NOT_INSTALLED',
								type: 'error',
								message: __('No Xcode installations found.') + '\n' +
									__('You will need to login into %s with your Apple Download account and download the latest Xcode version.',
										'__https://developer.apple.com/ios/manage/certificates/team/index.action__')
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

			xcodeCLIToolsInstalled: function (done) {
				var check = function (installed) {
					if (!installed) {
						issues.push({
							id: 'IOS_XCODE_CLI_TOOLS_NOT_INSTALLED',
							type: 'error',
							message: __('The Xcode Command Line Tools are not installed.') + '\n' +
								__('Titanium requires that the Xcode Command Line Tools be installed.') + '\n' +
								__('You can install them from the Xcode Preferences > Downloads tab.')
						});
					}
					done(null, installed);
				}

				if (executables.pkgutil) {
					run(executables.pkgutil, '--pkg-info=com.apple.pkg.DeveloperToolsCLI', function (err, stdout, stderr) {
						check(!err);
					});
				} else {
					check(false);
				}
			},

			certs: function (done) {
				var result = {
						keychains: {
							'System Default': {} // this is a dummy entry and doesn't really have any certs
						},
						wwdr: false
					},
					check = function () {
						if (!result.wwdr) {
							issues.push({
								id: 'IOS_NO_WWDR_CERT_FOUND',
								type: 'error',
								message: __('Apple’s World Wide Developer Relations (WWDR) intermediate certificate is not installed.') + '\n' +
									__('This will prevent you from building apps for iOS devices or package for distribution.') + '\n' +
									__('Download and install the certificate from %s', '__http://developer.apple.com/certificationauthority/AppleWWDRCA.cer__')
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
										'__https://developer.apple.com/account/ios/certificate/certificateList.action?type=development__')
							});
						}

						if (!validDistCerts) {
							issues.push({
								id: 'IOS_NO_VALID_DIST_CERTS_FOUND',
								type: 'warning',
								message: __('Unable to find any valid iOS production distribution certificates.') + '\n' +
									__('This will prevent you from packaging apps for distribution.') + '\n' +
									__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
										'__https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__')
							});
						}

						done(null, result);
					};

				// load the keychain cache which has the cert dates so we don't
				// have to call openssl (which is really slow)
				var keychainCache = {},
					keychainCacheFile = afs.resolvePath('~/.titanium/ios-keychain-cache.json');

				if (afs.exists(keychainCacheFile)) {
					try {
						keychainCache = JSON.parse(fs.readFileSync(keychainCacheFile));
					} catch (ex) {}
				}

				if (!executables.security) {
					return check();
				}

				run(executables.security, 'list-keychains', function (err, stdout, stderr) {
					if (!err) {
						stdout.split('\n').forEach(function (line) {
							var m = line.match(/[^"]*"([^"]*)"/);
							if (m) {
								result.keychains[m[1].trim()] = {};
							}
						});
					}

					run(executables.security, 'dump-keychain', function (err, stdout, stderr) {
						if (err) {
							// not sure this is possible, but assume we have no certs
							return check();
						}

						// these are used to make sure we don't create dupes
						var lookup = {};

						async.series(stdout.split('keychain: ').map(function (chunk) {
							return function (next) {
								// check if this cert is one we care about
								var m = chunk.match(/"alis"<blob>=[^"]*"(?:(?:iPhone (Developer|Distribution)\: (.*))|(Apple Worldwide Developer Relations Certification Authority))"/);
								if (!m) return next();

								if (m[3]) {
									result.wwdr = true;
									return next();
								}

								var type = m[1].toLowerCase(),
									name = encoding.decodeOctalUTF8(m[2]),
									keychain = chunk.match(/^\s*"(.+)"/),
									lookupKey = keychain + '|' + type + '|' + name;

								// if we find a dupe, move on to the next cert
								if (lookup[lookupKey]) return next();

								// mark that we've visited this cert name
								lookup[lookupKey] = 1;

								// make sure the destination exists
								result.keychains[keychain[1]] || (result.keychains[keychain[1]] = {});
								result.keychains[keychain[1]][type] || (result.keychains[keychain[1]][type] = []);

								// check if this cert info is cached
								var cache = keychainCache[name],
									hash = crypto.createHash('md5').update(chunk).digest('hex');
								if (cache && cache.hash == hash) {
									var info = {
										name: name
									};
									cache.before && (info.before = new Date(cache.before));
									cache.after && (info.after = new Date(cache.after));
									info.expired = info.after ? info.after < new Date : false;
									info.invalid = info.expired || (info.before ? info.before > new Date : false);
									result.keychains[keychain[1]][type].push(info);
									return next();
								}

								// if openssl is not found, then we can't get the cert dates
								if (!executables.openssl || !executables.security) return next();

								// not cached, need to find every cert and call openssl to get the cert dates
								var opensslChild = spawn(executables.openssl, ['x509', '-dates']),
									certChild = spawn(executables.security, ['find-certificate', '-c', name, '-p', keychain[1]]),
									buf = '';

								certChild.stdout.pipe(opensslChild.stdin);

								opensslChild.stdout.on('data', function (data) {
									buf += data.toString();
								});

								opensslChild.on('close', function (code) {
									var info = {
										name: name
									};

									// find the dates
									buf.split('\n').forEach(function (line) {
										var m = line.match(/not(Before|After)=(.+)/);
										if (m) {
											info[m[1].toLowerCase()] = new Date(m[2]);
										}
									});

									info.expired = info.after ? info.after < new Date : false;
									info.invalid = info.expired || (info.before ? info.before > new Date : false);

									// add the cert info to the keychain cache
									keychainCache[name] = {
										hash: hash,
										name: name,
										before: info.before,
										after: info.after
									};
									result.keychains[keychain[1]][type].push(info);

									next();
								});
							};
						}), function () {
							// write the keychain cache
							fs.writeFileSync(keychainCacheFile, JSON.stringify(keychainCache, null, '\t'));

							// sort the names
							Object.keys(result.keychains).forEach(function (kc) {
								result.keychains[kc].developer && result.keychains[kc].developer.sort(function (a, b) { return a.name > b.name; });
								result.keychains[kc].distribution && result.keychains[kc].distribution.sort(function (a, b) { return a.name > b.name; });
							});

							check();
						});
					});
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
							} else if (new Buffer(p.DeveloperCertificates[0], 'base64').toString().indexOf('Distribution:') != -1) {
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
							__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
								'__https://developer.apple.com/account/ios/certificate/certificateList.action?type=development__')
					});
				}

				if (!provisioningProfiles.adhoc.length || !valid.adhoc) {
					issues.push({
						id: 'IOS_NO_VALID_ADHOC_PROVISIONING_PROFILES',
						type: 'warning',
						message: __('Unable to find any valid iOS adhoc provisioning profiles.') + '\n' +
							__('This will prevent you from packaging apps for adhoc distribution.') + '\n' +
							__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
								'__https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__')
					});
				}

				if (!provisioningProfiles.distribution.length || !valid.distribution) {
					issues.push({
						id: 'IOS_NO_VALID_DISTRIBUTION_PROVISIONING_PROFILES',
						type: 'warning',
						message: __('Unable to find any valid iOS distribution provisioning profiles.') + '\n' +
							__('This will prevent you from packaging apps for AppStore distribution.') + '\n' +
							__('You will need to login into %s with your Apple Download account, then create, download, and install a certificate.',
								'__https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__')
					});
				}

				done(null, provisioningProfiles);
			}

		}, function (err, results) {
			appc.util.mix(results, executables);

			results.detectVersion    = '2.0';
			results.minIosSdkVersion = iosPackageJson.minIosSdkVersion;
			results.maxIosSdkVersion = iosPackageJson.maxIosSdkVersion;
			results.minXcodeVersion  = iosPackageJson.minXcodeVersion;
			results.maxXcodeVersion  = iosPackageJson.maxXcodeVersion;
			results.issues           = issues;

			finished(envCache = results);
		});
	});

};
