/**
 * Detects iOS development environment and displays it in the "titanium info" command.
 *
 * @module lib/info
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import appc from 'node-appc';
import fs from 'node:fs';
import ioslib from 'ioslib';
import moment from 'moment';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifestJson, loadPackageJson } from '../../../cli/lib/pkginfo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iosPackageJson = loadPackageJson(__dirname);
const manifestJson = loadManifestJson(__dirname);

export const name = 'ios';

export const title = 'iOS';

export function detect(types, config, next) {
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
					issue.message += '\nIf you know where this executable is, you can tell the Titanium CLI where it located by running \'ti config osx.executables.security /path/to/security\'.';
					break;
				case 'IOS_XCODE_SELECT_EXECUTABLE_NOT_FOUND':
					issue.message += '\nIf you know where this executable is, you can tell the Titanium CLI where it located by running \'ti config osx.executables.xcodeSelect /path/to/xcode-select\'.';
					break;
				case 'IOS_XCODE_TOO_OLD':
					issue.message = `Xcode __${issue.xcodeVer}__ is too old and is no longer supported by Titanium SDK ${manifestJson.version}.\n`
						+ `The minimum supported Xcode version by Titanium SDK ${manifestJson.version} is Xcode ${issue.minSupportedVer}.`;
					break;
				case 'IOS_XCODE_TOO_NEW':
					issue.message = `Xcode __${issue.xcodeVer}__ may or may not work with Titanium SDK ${manifestJson.version}.\n`
						+ `The maximum supported Xcode version by Titanium SDK ${manifestJson.version} is Xcode ${issue.maxSupportedVer}.`;
					break;
				case 'IOS_NO_WWDR_CERT_FOUND':
					issue.message += '\nDownload and install the certificate from __https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer__';
					break;
				case 'IOS_NO_KEYCHAINS_FOUND':
					issue.message += '\nTitanium will most likely not be able to detect any developer or App Store distribution certificates.';
					break;
				case 'IOS_NO_VALID_DEV_CERTS_FOUND':
					issue.message += '\nYou will need to log in to __https://developer.apple.com/account/ios/certificate/certificateList.action?type=development__ with your Apple Developer account, then create, download, and install a certificate.';
					break;
				case 'IOS_NO_VALID_DIST_CERTS_FOUND':
					issue.message += '\nYou will need to log in to __https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__ with your Apple Developer account, then create, download, and install a certificate.';
					break;
				case 'IOS_NO_VALID_DEVELOPMENT_PROVISIONING_PROFILES':
					issue.message += '\nYou will need to log in to __https://developer.apple.com/account/ios/certificate/certificateList.action?type=development__ with your Apple Developer account, then create, download, and install a profile.';
					break;
				case 'IOS_NO_VALID_ADHOC_PROVISIONING_PROFILES':
					issue.message += '\nYou will need to log in to __https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__ with your Apple Developer account, then create, download, and install a profile.';
					break;
				case 'IOS_NO_VALID_DISTRIBUTION_PROVISIONING_PROFILES':
					issue.message += '\nYou will need to log in to __https://developer.apple.com/account/ios/certificate/certificateList.action?type=distribution__ with your Apple Developer account, then create, download, and install a profile.';
					break;
			}
		});

		this.data = results;
		next(null, { ios: results });
	}.bind(this));
}

export function render(logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) {
		return;
	}

	// Xcode
	logger.log(styleHeading('Xcode'));
	if (Object.keys(data.xcode).length) {
		Object.keys(data.xcode).sort().reverse().forEach(function (ver) {
			var x = data.xcode[ver];
			logger.log('  ' + (x.version + ' (build ' + x.build + ')' + (x.selected ? ' - Xcode default' : '')).cyan);
			logger.log('  ' + rpad('  Install Location')                  + ' = ' + styleValue(x.path));
			logger.log('  ' + rpad('  iOS SDKs')                          + ' = ' + styleValue(x.sdks.length ? x.sdks.join(', ') : 'none'));
			logger.log('  ' + rpad('  iOS Simulators')                    + ' = ' + styleValue(x.sims.length ? x.sims.join(', ') : 'none'));

			if (x.watchos) {
				logger.log('  ' + rpad('  Watch SDKs')                    + ' = ' + styleValue(x.watchos.sdks.length ? x.watchos.sdks.join(', ') : 'none'));
				logger.log('  ' + rpad('  Watch Simulators')              + ' = ' + styleValue(x.watchos.sims.length ? x.watchos.sims.join(', ') : 'none'));
			} else {
				logger.log('  ' + rpad('  Watch SDKs')                    + ' = ' + styleValue('not supported'));
				logger.log('  ' + rpad('  Watch Simulators')              + ' = ' + styleValue('not supported'));
			}

			logger.log('  ' + rpad(`  Supported by TiSDK ${data.tisdk}`)  + ' = ' + styleValue(x.supported === 'maybe' ? 'maybe' : x.supported ? 'yes' : 'no'));
			logger.log('  ' + rpad('  EULA Accepted')                     + ' = ' + styleValue(x.eulaAccepted ? 'yes' : 'no'));

			if (Object.keys(x.teams).length) {
				Object.keys(x.teams).forEach(function (id, i) {
					if (i === 0) {
						logger.log('  ' + rpad('  Teams')                 + ' = ' + styleValue(id) + ' ' + x.teams[id].name + ' - ' + x.teams[id].type + (' (' + x.teams[id].status + ')').grey);
					} else {
						logger.log('  ' + rpad('       ')                 + ' = ' + styleValue(id) + ' ' + x.teams[id].name + ' - ' + x.teams[id].type + (' (' + x.teams[id].status + ')').grey);
					}
				});
			} else {
				logger.log('  ' + rpad('  Teams')                         + ' = ' + styleValue('none'));
			}
		});
		logger.log();
	} else {
		logger.log('No Xcode installations found.'.grey + '\n');
	}

	// ios keychains
	logger.log(
		styleHeading('iOS Keychains') + '\n'
		+ Object.keys(data.certs.keychains).sort().reverse().map(function (keychain) {
			return '  ' + rpad(path.basename(keychain)) + ' = ' + styleValue(keychain);
		}).join('\n') + '\n');

	// ios certs
	logger.log(styleHeading('iOS Development Certificates'));
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
					logger.log('  ' + dev.fullname.cyan + (dev.expired ? ' ' + styleBad('**EXPIRED**') : dev.invalid ? ' ' + styleBad('**NOT VALID**') : ''));
					logger.log('  ' + rpad('  Not valid before') + ' = ' + styleValue(moment(dev.before).format('l LT')));
					logger.log('  ' + rpad('  Not valid after') + ' = ' + styleValue(moment(dev.after).format('l LT')));
				});
			}
		});
	}
	logger.log(counter ? '' : '  ' + 'none'.grey + '\n');

	logger.log(styleHeading('iOS App Store Distribution Certificates'));
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
					logger.log('  ' + dist.fullname.cyan + (dist.expired ? ' ' + styleBad('**EXPIRED**') : dist.invalid ? ' ' + styleBad('**NOT VALID**') : ''));
					logger.log('  ' + rpad('  Not valid before') + ' = ' + styleValue(moment(dist.before).format('l LT')));
					logger.log('  ' + rpad('  Not valid after') + ' = ' + styleValue(moment(dist.after).format('l LT')));
				});
			}
		});
	}
	logger.log(counter ? '' : '  ' + 'none'.grey + '\n');

	// wwdr cert
	logger.log(styleHeading('Apple WWDR Certificate'));
	if (data.certs.wwdr) {
		logger.log('  ' + rpad('Apple WWDR') + ' = ' + styleValue('installed') + '\n');
	} else {
		logger.log('  ' + rpad('Apple WWDR') + ' = ' + styleBad('not found') + '\n');
	}

	function printProfiles(profiles) {
		if (profiles.length) {
			profiles.sort(function (a, b) {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}).forEach(function (profile) {
				let appId = profile.entitlements['application-identifier'] || '';
				appId = profile.appPrefix ? appId.replace(new RegExp('^' + profile.appPrefix + '\\.'), '') : appId; // eslint-disable-line security/detect-non-literal-regexp

				logger.log('  ' + profile.name.cyan + (profile.expired ? ' ' + styleBad('**EXPIRED**') : ''));
				logger.log('  ' + rpad('  UUID')       + ' = ' + styleValue(profile.uuid));
				logger.log('  ' + rpad('  App Prefix') + ' = ' + styleValue(profile.appPrefix));
				logger.log('  ' + rpad('  App Id')     + ' = ' + styleValue(appId));
				logger.log('  ' + rpad('  Date Created') + ' = ' + styleValue(profile.creationDate ? moment(profile.creationDate).format('l LT') : 'unknown'));
				logger.log('  ' + rpad('  Date Expired') + ' = ' + styleValue(profile.expirationDate ? moment(profile.expirationDate).format('l LT') : 'unknown'));
				logger.log('  ' + rpad('  Managed') + ' = ' + (profile.managed ? styleBad('Yes and is NOT compatible with Titanium') : styleValue('no')));
			});
			logger.log();
		} else {
			logger.log('  ' + 'none'.grey + '\n');
		}
	}

	// provisioning profiles
	logger.log(styleHeading('Development iOS Provisioning Profiles'));
	printProfiles(data.provisioning.development);

	logger.log(styleHeading('App Store Distribution iOS Provisioning Profiles'));
	printProfiles(data.provisioning.distribution);

	logger.log(styleHeading('Ad Hoc iOS Provisioning Profiles'));
	printProfiles(data.provisioning.adhoc);

	logger.log(styleHeading('Enterprise Ad Hoc iOS Provisioning Profiles'));
	printProfiles(data.provisioning.enterprise);

	logger.log(styleHeading('iOS Simulators'));
	if (data.simulators.ios && Object.keys(data.simulators.ios).length) {
		function sortVersion(a, b) {
			return appc.version.eq(a, b) ? 0 : appc.version.lt(a, b) ? -1 : 1;
		}

		Object.keys(data.simulators.ios).sort(sortVersion).forEach(function (ver) {
			logger.log(String(ver).grey);
			logger.log(data.simulators.ios[ver].map(function (sim) {
				return '  ' + sim.name.cyan + (sim.name !== sim.deviceName ? ' (' + sim.deviceName + ')' : '') + (' (' + sim.family + ')').grey + '\n' + [
					'  ' + rpad('  UDID')                + ' = ' + styleValue(sim.udid),
					'  ' + rpad('  Supports Watch Apps') + ' = ' + styleValue(Object.keys(sim.supportsWatch).filter(function (x) { return sim.supportsWatch[x]; }).length ? 'yes' : 'no')
				].join('\n');
			}).join('\n') + '\n');
		});
	} else {
		logger.log('  ' + 'none'.grey + '\n');
	}

	logger.log(styleHeading('WatchOS Simulators'));
	if (data.simulators.watchos && Object.keys(data.simulators.watchos).length) {
		Object.keys(data.simulators.watchos).sort().forEach(function (ver) {
			logger.log(String(ver).grey);
			logger.log(data.simulators.watchos[ver].map(function (sim) {
				return '  ' + sim.name.cyan + (sim.name !== sim.deviceName ? ' (' + sim.deviceName + ')' : '') + (' (' + sim.family + ')').grey + '\n' + [
					'  ' + rpad('  UDID') + ' = ' + styleValue(sim.udid)
				].join('\n');
			}).join('\n') + '\n');
		});
	} else {
		logger.log('  ' + 'none'.grey + '\n');
	}

	logger.log(styleHeading('Connected iOS Devices'));
	const devices = data.devices;
	if (devices.length) {
		logger.log(devices.map(function (device) {
			return '  ' + device.name.cyan + '\n' + [
				'  ' + rpad('  UDID')             + ' = ' + styleValue(device.udid),
				'  ' + rpad('  Type')             + ' = ' + styleValue(device.deviceClass + ' (' + device.deviceColor + ')'),
				'  ' + rpad('  iOS Version')      + ' = ' + styleValue(device.productVersion),
				'  ' + rpad('  CPU Architecture') + ' = ' + styleValue(device.cpuArchitecture)
			].join('\n');
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + 'none'.grey + '\n');
	}
}
