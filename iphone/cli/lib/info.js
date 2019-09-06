/**
 * Detects iOS development environment and displays it in the "titanium info" command.
 *
 * @module lib/info
 *
 * @copyright
 * Copyright (c) 2014-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc'),
	fs = require('fs'),
	ioslib = require('ioslib'),
	iosPackageJson = appc.pkginfo.package(module),
	manifestJson = appc.pkginfo.manifest(module),
	moment = require('moment'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

exports.name = 'ios';

exports.title = 'iOS';

exports.detect = function (types, config, next) {
	ioslib.detect({
		// env
		xcodeSelect: config.get('osx.executables.xcodeSelect'),
		security: config.get('osx.executables.security'),
		// provisioning
		profileDir: config.get('ios.profileDir'),
		// xcode
		searchPath: config.get('paths.xcode'),
		minIosVersion: iosPackageJson.minIosVersion,
		minWatchosVersion: iosPackageJson.minWatchosVersion,
		supportedVersions: iosPackageJson.vendorDependencies.xcode
	}, function (err, results) {
		if (err) {
			return next(err);
		}

		results.devices.unshift({
			udid: 'itunes',
			name: 'iTunes Sync'
		});

		results.tisdk = path.basename((function scan(dir) {
			var file = path.join(dir, 'manifest.json');
			if (fs.existsSync(file)) {
				return dir;
			}
			dir = path.dirname(dir);
			return dir !== '/' && scan(dir);
		}(__dirname)));

		if (results.issues.length) {
			this.issues = this.issues.concat(results.issues);
		}

		// improve error messages
		this.issues.forEach(function (issue) {
			switch (issue.id) {
				case 'IOS_SECURITY_EXECUTABLE_NOT_FOUND':
					issue.message += '\n' + __('If you know where this executable is, you can tell the Titanium CLI where it located by running \'%stitanium config osx.executables.security /path/to/security\'.', process.env.APPC_ENV ? 'appc ' : '');
					break;
				case 'IOS_XCODE_SELECT_EXECUTABLE_NOT_FOUND':
					issue.message += '\n' + __('If you know where this executable is, you can tell the Titanium CLI where it located by running \'%stitanium config osx.executables.xcodeSelect /path/to/xcode-select\'.', process.env.APPC_ENV ? 'appc ' : '');
					break;
				case 'IOS_XCODE_TOO_OLD':
					issue.message = __('Xcode %s is too old and is no longer supported by Titanium SDK %s.', '__' + issue.xcodeVer + '__', manifestJson.version) + '\n'
						+ __('The minimum supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, issue.minSupportedVer);
					break;
				case 'IOS_XCODE_TOO_NEW':
					issue.message = __('Xcode %s may or may not work with Titanium SDK %s.', '__' + issue.xcodeVer + '__', manifestJson.version) + '\n'
						+ __('The maximum supported Xcode version by Titanium SDK %s is Xcode %s.', manifestJson.version, issue.maxSupportedVer);
					break;
				case 'IOS_NO_WWDR_CERT_FOUND':
					issue.message += '\n' + __('Download and install the certificate from %s', '__http://appcelerator.com/ios-wwdr__');
					break;
				case 'IOS_NO_KEYCHAINS_FOUND':
					issue.message += '\n' + __('Titanium will most likely not be able to detect any developer or App Store distribution certificates.');
					break;
				case 'IOS_NO_VALID_DEV_CERTS_FOUND':
					issue.message += '\n' + __('You will need to log in to %s with your Apple Developer account, then create, download, and install a certificate.', '__http://appcelerator.com/ios-dev-certs__');
					break;
				case 'IOS_NO_VALID_DIST_CERTS_FOUND':
					issue.message += '\n' + __('You will need to log in to %s with your Apple Developer account, then create, download, and install a certificate.', '__http://appcelerator.com/ios-dist-certs__');
					break;
				case 'IOS_NO_VALID_DEVELOPMENT_PROVISIONING_PROFILES':
					issue.message += '\n' + __('You will need to log in to %s with your Apple Developer account, then create, download, and install a profile.', '__http://appcelerator.com/ios-dev-certs__');
					break;
				case 'IOS_NO_VALID_ADHOC_PROVISIONING_PROFILES':
					issue.message += '\n' + __('You will need to log in to %s with your Apple Developer account, then create, download, and install a profile.', '__http://appcelerator.com/ios-dist-certs__');
					break;
				case 'IOS_NO_VALID_DISTRIBUTION_PROVISIONING_PROFILES':
					issue.message += '\n' + __('You will need to log in to %s with your Apple Developer account, then create, download, and install a profile.', '__http://appcelerator.com/ios-dist-certs__');
					break;
			}
		});

		this.data = results;
		next(null, { ios: results });
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) {
		return;
	}

	// Xcode
	logger.log(styleHeading(__('Xcode')));
	if (Object.keys(data.xcode).length) {
		Object.keys(data.xcode).sort().reverse().forEach(function (ver) {
			var x = data.xcode[ver];
			logger.log('  ' + (x.version + ' (build ' + x.build + ')' + (x.selected ? ' - Xcode default' : '')).cyan);
			logger.log('  ' + rpad('  ' + __('Install Location'))                  + ' = ' + styleValue(x.path));
			logger.log('  ' + rpad('  ' + __('iOS SDKs'))                          + ' = ' + styleValue(x.sdks.length ? x.sdks.join(', ') : 'none'));
			logger.log('  ' + rpad('  ' + __('iOS Simulators'))                    + ' = ' + styleValue(x.sims.length ? x.sims.join(', ') : 'none'));

			if (x.watchos) {
				logger.log('  ' + rpad('  ' + __('Watch SDKs'))                    + ' = ' + styleValue(x.watchos.sdks.length ? x.watchos.sdks.join(', ') : 'none'));
				logger.log('  ' + rpad('  ' + __('Watch Simulators'))              + ' = ' + styleValue(x.watchos.sims.length ? x.watchos.sims.join(', ') : 'none'));
			} else {
				logger.log('  ' + rpad('  ' + __('Watch SDKs'))                    + ' = ' + styleValue(__('not supported')));
				logger.log('  ' + rpad('  ' + __('Watch Simulators'))              + ' = ' + styleValue(__('not supported')));
			}

			logger.log('  ' + rpad('  ' + __('Supported by TiSDK %s', data.tisdk)) + ' = ' + styleValue(x.supported === 'maybe' ? __('maybe') : x.supported ? __('yes') : __('no')));
			logger.log('  ' + rpad('  ' + __('EULA Accepted'))                     + ' = ' + styleValue(x.eulaAccepted ? __('yes') : __('no')));

			if (Object.keys(x.teams).length) {
				Object.keys(x.teams).forEach(function (id, i) {
					if (i === 0) {
						logger.log('  ' + rpad('  ' + __('Teams'))                 + ' = ' + styleValue(id) + ' ' + x.teams[id].name + ' - ' + x.teams[id].type + (' (' + x.teams[id].status + ')').grey);
					} else {
						logger.log('  ' + rpad('       ')                          + ' = ' + styleValue(id) + ' ' + x.teams[id].name + ' - ' + x.teams[id].type + (' (' + x.teams[id].status + ')').grey);
					}
				});
			} else {
				logger.log('  ' + rpad('  ' + __('Teams'))                         + ' = ' + styleValue(__('none')));
			}
		});
		logger.log();
	} else {
		logger.log(__('No Xcode installations found.').grey + '\n');
	}

	// ios keychains
	logger.log(
		styleHeading(__('iOS Keychains')) + '\n'
		+ Object.keys(data.certs.keychains).sort().reverse().map(function (keychain) {
			return '  ' + rpad(path.basename(keychain)) + ' = ' + styleValue(keychain);
		}).join('\n') + '\n');

	// ios certs
	logger.log(styleHeading(__('iOS Development Certificates')));
	let counter = 0;
	if (Object.keys(data.certs.keychains).length) {
		Object.keys(data.certs.keychains).forEach(function (keychain) {
			const devs = data.certs.keychains[keychain].developer || [];
			if (devs.length) {
				logger.log(keychain.grey);
				devs.sort(function (a, b) {
					return a.fullname === b.fullname ? 0 : a.fullname < b.fullname ? -1 : 1;
				}).forEach(function (dev) {
					counter++;
					logger.log('  ' + dev.fullname.cyan + (dev.expired ? ' ' + styleBad(__('**EXPIRED**')) : dev.invalid ? ' ' + styleBad(__('**NOT VALID**')) : ''));
					logger.log('  ' + rpad('  ' + __('Not valid before')) + ' = ' + styleValue(moment(dev.before).format('l LT')));
					logger.log('  ' + rpad('  ' + __('Not valid after')) + ' = ' + styleValue(moment(dev.after).format('l LT')));
				});
			}
		});
	}
	logger.log(counter ? '' : '  ' + __('None').grey + '\n');

	logger.log(styleHeading(__('iOS App Store Distribution Certificates')));
	counter = 0;
	if (Object.keys(data.certs.keychains).length) {
		Object.keys(data.certs.keychains).forEach(function (keychain) {
			const dists = data.certs.keychains[keychain].distribution || [];
			if (dists.length) {
				logger.log(keychain.grey);
				dists.sort(function (a, b) {
					return a.fullname === b.fullname ? 0 : a.fullname < b.fullname ? -1 : 1;
				}).forEach(function (dist) {
					counter++;
					logger.log('  ' + dist.fullname.cyan + (dist.expired ? ' ' + styleBad(__('**EXPIRED**')) : dist.invalid ? ' ' + styleBad(__('**NOT VALID**')) : ''));
					logger.log('  ' + rpad('  ' + __('Not valid before')) + ' = ' + styleValue(moment(dist.before).format('l LT')));
					logger.log('  ' + rpad('  ' + __('Not valid after')) + ' = ' + styleValue(moment(dist.after).format('l LT')));
				});
			}
		});
	}
	logger.log(counter ? '' : '  ' + __('None').grey + '\n');

	// wwdr cert
	logger.log(styleHeading(__('Apple WWDR Certificate')));
	if (data.certs.wwdr) {
		logger.log('  ' + rpad(__('Apple WWDR')) + ' = ' + styleValue(__('installed')) + '\n');
	} else {
		logger.log('  ' + rpad(__('Apple WWDR')) + ' = ' + styleBad(__('not found')) + '\n');
	}

	function printProfiles(profiles) {
		if (profiles.length) {
			profiles.sort(function (a, b) {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}).forEach(function (profile) {
				let appId = profile.entitlements['application-identifier'] || '';
				appId = profile.appPrefix ? appId.replace(new RegExp('^' + profile.appPrefix + '\\.'), '') : appId; // eslint-disable-line security/detect-non-literal-regexp

				logger.log('  ' + profile.name.cyan + (profile.expired ? ' ' + styleBad(__('**EXPIRED**')) : ''));
				logger.log('  ' + rpad('  ' + __('UUID'))       + ' = ' + styleValue(profile.uuid));
				logger.log('  ' + rpad('  ' + __('App Prefix')) + ' = ' + styleValue(profile.appPrefix));
				logger.log('  ' + rpad('  ' + __('App Id'))     + ' = ' + styleValue(appId));
				logger.log('  ' + rpad('  ' + __('Date Created')) + ' = ' + styleValue(profile.creationDate ? moment(profile.creationDate).format('l LT') : 'unknown'));
				logger.log('  ' + rpad('  ' + __('Date Expired')) + ' = ' + styleValue(profile.expirationDate ? moment(profile.expirationDate).format('l LT') : 'unknown'));
				logger.log('  ' + rpad('  ' + __('Managed')) + ' = ' + (profile.managed ? styleBad(__('Yes and is NOT compatible with Titanium')) : styleValue(__('No'))));
			});
			logger.log();
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}
	}

	// provisioning profiles
	logger.log(styleHeading(__('Development iOS Provisioning Profiles')));
	printProfiles(data.provisioning.development);

	logger.log(styleHeading(__('App Store Distribution iOS Provisioning Profiles')));
	printProfiles(data.provisioning.distribution);

	logger.log(styleHeading(__('Ad Hoc iOS Provisioning Profiles')));
	printProfiles(data.provisioning.adhoc);

	logger.log(styleHeading(__('Enterprise Ad Hoc iOS Provisioning Profiles')));
	printProfiles(data.provisioning.enterprise);

	logger.log(styleHeading(__('iOS Simulators')));
	if (data.simulators.ios && Object.keys(data.simulators.ios).length) {
		function sortVersion(a, b) {
			return appc.version.eq(a, b) ? 0 : appc.version.lt(a, b) ? -1 : 1;
		}

		Object.keys(data.simulators.ios).sort(sortVersion).forEach(function (ver) {
			logger.log(String(ver).grey);
			logger.log(data.simulators.ios[ver].map(function (sim) {
				return '  ' + sim.name.cyan + (sim.name !== sim.deviceName ? ' (' + sim.deviceName + ')' : '') + (' (' + sim.family + ')').grey + '\n' + [
					'  ' + rpad('  ' + __('UDID'))                + ' = ' + styleValue(sim.udid),
					'  ' + rpad('  ' + __('Supports Watch Apps')) + ' = ' + styleValue(Object.keys(sim.supportsWatch).filter(function (x) { return sim.supportsWatch[x]; }).length ? __('yes') : __('no'))
				].join('\n');
			}).join('\n') + '\n');
		});
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('WatchOS Simulators')));
	if (data.simulators.watchos && Object.keys(data.simulators.watchos).length) {
		Object.keys(data.simulators.watchos).sort().forEach(function (ver) {
			logger.log(String(ver).grey);
			logger.log(data.simulators.watchos[ver].map(function (sim) {
				return '  ' + sim.name.cyan + (sim.name !== sim.deviceName ? ' (' + sim.deviceName + ')' : '') + (' (' + sim.family + ')').grey + '\n' + [
					'  ' + rpad('  ' + __('UDID')) + ' = ' + styleValue(sim.udid)
				].join('\n');
			}).join('\n') + '\n');
		});
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('Connected iOS Devices')));
	const devices = data.devices.filter(function (device) {
		return device.udid !== 'itunes';
	});
	if (devices.length) {
		logger.log(devices.map(function (device) {
			return '  ' + device.name.cyan + '\n' + [
				'  ' + rpad('  ' + __('UDID'))             + ' = ' + styleValue(device.udid),
				'  ' + rpad('  ' + __('Type'))             + ' = ' + styleValue(device.deviceClass + ' (' + device.deviceColor + ')'),
				'  ' + rpad('  ' + __('iOS Version'))      + ' = ' + styleValue(device.productVersion),
				'  ' + rpad('  ' + __('CPU Architecture')) + ' = ' + styleValue(device.cpuArchitecture)
			].join('\n');
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}
};
