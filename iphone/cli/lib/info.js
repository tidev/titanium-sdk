var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	moment = require('moment'),
	path = require('path');

exports.name = 'ios';

exports.title = 'iOS';

exports.detect = function (types, config, next) {
	var tisdk = path.basename((function scan(dir) {
		var file = path.join(dir, 'manifest.json');
		if (fs.existsSync(file)) {
			return dir;
		}
		dir = path.dirname(dir);
		return dir != '/' && scan(dir);
	}(__dirname)));

	var mod = require('./detect');

	// detect ios environment
	mod.detect(config, null, function (result) {
		// detect devices
		mod.detectDevices(function (err, devices) {
			// detect emulators
			mod.detectSimulators(config, function (err, simulators) {
				result.tisdk = tisdk;
				result.devices = devices;
				result.simulators = simulators;

				this.data = result;
				if (result.issues.length) {
					this.issues = this.issues.concat(result.issues);
				}

				next(null, { ios: result });
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	// Xcode
	logger.log(styleHeading(__('Xcode')));
	if (Object.keys(data.xcode).length) {
		Object.keys(data.xcode).sort().reverse().forEach(function (ver) {
			var x = data.xcode[ver];
			logger.log(
				'  ' + (x.version + ' (build ' + x.build + ')' + (x.selected ? ' - Xcode default' : '')).cyan + '\n' +
				'  ' + rpad('  ' + __('Install Location'))                  + ' = ' + styleValue(x.path) + '\n' +
				'  ' + rpad('  ' + __('iOS SDKs'))                          + ' = ' + styleValue(x.sdks.length ? x.sdks.join(', ') : 'none') + '\n' +
				'  ' + rpad('  ' + __('iOS Simulators'))                    + ' = ' + styleValue(x.sims.length ? x.sims.join(', ') : 'none') + '\n' +
				'  ' + rpad('  ' + __('Supported by TiSDK %s', data.tisdk)) + ' = ' + styleValue(x.supported == 'maybe' ? 'maybe' : x.supported ? 'yes' : 'no')
			);
		});
		logger.log();
	} else {
		logger.log(__('No Xcode installations found.').grey + '\n');
	}

	// ios keychains
	logger.log(
		styleHeading(__('iOS Keychains')) + '\n' +
		Object.keys(data.certs.keychains).sort().reverse().map(function (keychain) {
			return '  ' + rpad(path.basename(keychain)) + ' = ' + styleValue(keychain);
		}).join('\n') + '\n');

	// ios certs
	logger.log(styleHeading(__('iOS Development Certificates')));
	var counter = 0;
	if (Object.keys(data.certs.keychains).length) {
		Object.keys(data.certs.keychains).forEach(function (keychain) {
			var devs = data.certs.keychains[keychain].developer || [];
			if (devs.length) {
				logger.log(keychain.grey);
				devs.sort(function (a, b) {
					return a.name == b.name ? 0 : a.name < b.name ? -1 : 1;
				}).forEach(function (dev) {
					counter++;
					logger.log('  ' + dev.name.cyan + (dev.expired ? ' ' + styleBad(__('**EXPIRED**')) : dev.invalid ? ' ' + styleBad(__('**NOT VALID**')) : ''));
					logger.log('  ' + rpad('  ' + __('Not valid before')) + ' = ' + styleValue(moment(dev.before).format('l LT')));
					logger.log('  ' + rpad('  ' + __('Not valid after')) + ' = ' + styleValue(moment(dev.after).format('l LT')));
				});
			}
		});
	}
	logger.log(counter ? '' : '  ' + __('None').grey + '\n');

	logger.log(styleHeading(__('iOS Distribution Certificates')));
	counter = 0;
	if (Object.keys(data.certs.keychains).length) {
		Object.keys(data.certs.keychains).forEach(function (keychain) {
			var dists = data.certs.keychains[keychain].distribution || [];
			if (dists.length) {
				logger.log(keychain.grey);
				dists.sort(function (a, b) {
					return a.name == b.name ? 0 : a.name < b.name ? -1 : 1;
				}).forEach(function (dist) {
					counter++;
					logger.log('  ' + dist.name.cyan + (dist.expired ? ' ' + styleBad(__('**EXPIRED**')) : dist.invalid ? ' ' + styleBad(__('**NOT VALID**')) : ''));
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
				logger.log('  ' + profile.name.cyan + (profile.expired ? ' ' + styleBad(__('**EXPIRED**')) : ''));
				logger.log('  ' + rpad('  ' + __('UUID'))       + ' = ' + styleValue(profile.uuid));
				logger.log('  ' + rpad('  ' + __('App Prefix')) + ' = ' + styleValue(profile.appPrefix));
				logger.log('  ' + rpad('  ' + __('App Id'))     + ' = ' + styleValue(profile.appId));
				logger.log('  ' + rpad('  ' + __('Date Created')) + ' = ' + styleValue(profile.creationDate ? moment(profile.creationDate).format('l LT') : 'unknown'));
				logger.log('  ' + rpad('  ' + __('Date Expired')) + ' = ' + styleValue(profile.expirationDate ? moment(profile.expirationDate).format('l LT') : 'unknown'));
			});
			logger.log();
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}
	}

	// provisioning profiles
	logger.log(styleHeading(__('Development iOS Provisioning Profiles')));
	printProfiles(data.provisioningProfiles.development);

	logger.log(styleHeading(__('Distribution iOS Provisioning Profiles')));
	printProfiles(data.provisioningProfiles.distribution);

	logger.log(styleHeading(__('Ad Hoc iOS Provisioning Profiles')));
	printProfiles(data.provisioningProfiles.adhoc);

	logger.log(styleHeading(__('iOS Simulators')));
	if (data.simulators && data.simulators.length) {
		logger.log(data.simulators.map(function (sim) {
			var features = '';
			return '  ' + sim.name.cyan + '\n' + [
				'  ' + rpad('  ' + __('Type'))         + ' = ' + styleValue(sim.type),
				'  ' + rpad('  ' + __('iOS Versions')) + ' = ' + styleValue(sim.versions.join(', ')),
				'  ' + rpad('  ' + __('Architecture')) + ' = ' + styleValue(sim['64bit'] ? '64-bit' : '32-bit'),
				'  ' + rpad('  ' + __('Features'))     + ' = ' + styleValue(sim.retina ? 'retina' + (sim.tall ? ', tall' : '') : (sim.tall ? 'tall' : 'n/a'))
			].join('\n');
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('Connected iOS Devices')));
	var iosDevices = data.devices && data.devices.filter(function (device) { return device.id != 'itunes'; });
	if (iosDevices.length) {
		logger.log(iosDevices.map(function (device) {
			return '  ' + device.name.cyan + '\n' + [
				'  ' + rpad('  ' + __('ID'))               + ' = ' + styleValue(device.id),
				'  ' + rpad('  ' + __('Type'))             + ' = ' + styleValue(device.deviceClass + ' (' + device.deviceColor + ')'),
				'  ' + rpad('  ' + __('iOS Version'))      + ' = ' + styleValue(device.productVersion),
				'  ' + rpad('  ' + __('CPU Architecture')) + ' = ' + styleValue(device.cpuArchitecture)
			].join('\n');
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}
};