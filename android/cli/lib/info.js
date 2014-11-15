var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path');

exports.name = 'android';

exports.title = 'Android';

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

	// detect android environment
	mod.detect(config, null, function (result) {
		// detect devices
		mod.detectDevices(config, function (err, devices) {
			// detect emulators
			mod.detectEmulators(config, function (err, emus) {
				result.tisdk = tisdk;
				result.devices = devices;
				result.emulators = emus;
				delete result.avds;

				this.data = result;
				if (result.issues.length) {
					this.issues = this.issues.concat(result.issues);
				}

				next(null, { android: result });
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	logger.log(styleHeading(__('Android SDK')) + '\n' +
		'  ' + rpad(__('Android Executable')) + ' = ' + styleValue(data.sdk && data.sdk.executables.android || __('not found')) + '\n' +
		'  ' + rpad(__('ADB Executable'))     + ' = ' + styleValue(data.sdk && data.sdk.executables.adb || __('not found')) + '\n' +
		'  ' + rpad(__('SDK Path'))           + ' = ' + styleValue(data.sdk && data.sdk.path || __('not found')) + '\n'
	);

	logger.log(styleHeading(__('Android NDK')) + '\n' +
		'  ' + rpad(__('NDK Path'))           + ' = ' + styleValue(data.ndk && data.ndk.path || __('not found')) + '\n' +
		'  ' + rpad(__('NDK Version'))        + ' = ' + styleValue(data.ndk && data.ndk.version || __('not found')) + '\n'
	);

	var androidPlatforms = '',
		androidAddons = '',
		apiLevelMap = {};

	if (data.targets && Object.keys(data.targets).length) {
		Object.keys(data.targets).forEach(function (targetId) {
			var target = data.targets[targetId],
				supported = (target.supported == 'maybe'
					? (' (' + __('not supported by Titanium SDK %s, but may work', data.tisdk) + ')').yellow
					: target.supported
						? ''
						: styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**'));

			if (target.type == 'platform') {
				var m = target.name.match(/Android\s+(\d(?:\.\d(?:\.\d)?)?)/);
				if (m) {
					apiLevelMap[m[1]] = target['api-level'];
				}
				androidPlatforms += '  ' + (targetId + ') ' + target.id).cyan + '\n' +
					'  ' + rpad('  ' + __('Name'))        + ' = ' + styleValue(target.name) + supported + '\n' +
					'  ' + rpad('  ' + __('API Level'))   + ' = ' + styleValue(target['api-level']) + '\n' +
					'  ' + rpad('  ' + __('Revision'))    + ' = ' + styleValue(target.revision) + '\n' +
					'  ' + rpad('  ' + __('Skins'))       + ' = ' + styleValue(target.skins.join(', ')) + '\n' +
					'  ' + rpad('  ' + __('ABIs'))        + ' = ' + styleValue(target.abis.join(', ')) + '\n' +
					'  ' + rpad('  ' + __('Path'))        + ' = ' + styleValue(target.path) + '\n';
			} else if (target.type == 'add-on') {
				androidAddons += '  ' + (targetId + ') ' + target.id).cyan + '\n' +
					'  ' + rpad('  ' + __('Name'))        + ' = ' + styleValue(target.name
						+ ' (' + target['based-on'] ? __('Android %s (API level %s)', target['based-on']['android-version'], target['based-on']['api-level']) : __('unknown') + ')') + supported + '\n' +
					'  ' + rpad('  ' + __('Vendor'))      + ' = ' + styleValue(target.vendor) + '\n' +
					'  ' + rpad('  ' + __('Revision'))    + ' = ' + styleValue(target.revision) + '\n' +
					'  ' + rpad('  ' + __('Description')) + ' = ' + styleValue(target.description) + '\n' +
					'  ' + rpad('  ' + __('Skins'))       + ' = ' + styleValue(target.skins.join(', ')) + '\n' +
					'  ' + rpad('  ' + __('ABIs'))        + ' = ' + styleValue(target.abis.join(', ')) + '\n' +
					'  ' + rpad('  ' + __('Path'))        + ' = ' + styleValue(target.path) + '\n';

				if (target.libraries && Object.keys(target.libraries).length) {
					Object.keys(target.libraries).map(function (lib, i) {
						androidAddons += '  ' + (i == 0 ? rpad('  ' + __('Libraries'))   + ' = ' : rpad('') + '   ') +
							styleValue(lib + ': ' + target.libraries[lib].description + ' (' + target.libraries[lib].jar + ')') + '\n';
					});
					androidAddons += '\n';
				} else {
					androidAddons += '  ' + rpad('  ' + __('Libraries'))   + ' = ' + styleValue(__('none')) + '\n';
				}
			}
		});
	}

	logger.log(styleHeading(__('Android Platforms')) + '\n' + (androidPlatforms ? androidPlatforms : '  ' + __('None').grey + '\n'));
	logger.log(styleHeading(__('Android Add-Ons')) + '\n' + (androidAddons ? androidAddons : '  ' + __('None').grey + '\n'));

	logger.log(styleHeading(__('Android Emulators')));
	if (data.emulators) {
		var emus = data.emulators.filter(function (e) { return e.type == 'avd'; });
		if (emus.length) {
			logger.log(emus.map(function (emu) {
				return '  ' + emu.name.cyan + '\n' +
					'  ' + rpad('  ' + __('Path'))        + ' = ' + styleValue(emu.path) + '\n' +
					'  ' + rpad('  ' + __('SDK Version')) + ' = ' + styleValue(emu.target) + '\n' +
					'  ' + rpad('  ' + __('ABI'))         + ' = ' + styleValue(emu.abi) + '\n' +
					'  ' + rpad('  ' + __('Skin'))        + ' = ' + styleValue(emu.skin) + '\n' +
					'  ' + rpad('  ' + __('SD Card'))     + ' = ' + styleValue(emu.sdcard || __('no sd card')) + '\n' +
					(emu['based-on']
						? '  ' + rpad('  ' + __('Based On'))    + ' = ' + styleValue(__('Android %s (API level %s)', emu['based-on']['android-version'], emu['based-on']['api-level'])) + '\n'
						: ''
					) +
					'  ' + rpad('  ' + __('Google APIs')) + ' = ' + styleValue(emu.googleApis ? __('yes') : __('no'));
			}).join('\n') + '\n');
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('Genymotion Emulators')));
	if (data.emulators) {
		var emus = data.emulators.filter(function (e) { return e.type == 'genymotion'; });
		if (emus.length) {
			logger.log(emus.map(function (emu) {
				return '  ' + emu.name.cyan + '\n' +
					'  ' + rpad('  ' + __('SDK Version'))         + ' = ' + styleValue(emu.target + (apiLevelMap[emu.target] ? ' (android-' + apiLevelMap[emu.target] + ')' : '')) + '\n' +
					'  ' + rpad('  ' + __('ABI'))                 + ' = ' + styleValue(emu.abi || __('unknown')) + '\n' +
					'  ' + rpad('  ' + __('Genymotion Version'))  + ' = ' + styleValue(emu.genymotion || __('unknown')) + '\n' +
					'  ' + rpad('  ' + __('Display'))             + ' = ' + styleValue(emu.display || __('unknown')) + '\n' +
					'  ' + rpad('  ' + __('DPI'))                 + ' = ' + styleValue(emu.dpi || __('unknown')) + '\n' +
					'  ' + rpad('  ' + __('OpenGL Acceleration')) + ' = ' + styleValue(emu.hardwareOpenGL ? __('yes') : __('no')) + '\n' +
					'  ' + rpad('  ' + __('Google APIs'))         + ' = ' + styleValue(emu.googleApis === null ? __('unknown, emulator not running') : emu.googleApis ? __('yes') : __('no'));
			}).join('\n') + '\n');
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('Connected Android Devices')));
	if (data.devices && data.devices.length) {
		logger.log(data.devices.map(function (device) {
			var name = device.name,
				result = [
					'  ' + rpad(__('ID'))          + ' = ' + styleValue(device.id),
					'  ' + rpad(__('State'))       + ' = ' + styleValue(device.state)
				];

			if (device.release) {
				result.push('  ' + rpad(__('SDK Version')) + ' = ' + styleValue(device.release + ' (android-' + device.sdk + ')'));
			}

			if (Array.isArray(device.abi)) {
				result.push('  ' + rpad(__('ABIs'))        + ' = ' + styleValue(device.abi.join(', ')));
			}

			if (device.emulator) {
				switch (device.emulator.type) {
					case 'avd':
						name = 'Android Emulator: ' + device.emulator.name;
						result.push('  ' + rpad(__('Skin'))        + ' = ' + styleValue(device.emulator.skin || __('unknown')));
						result.push('  ' + rpad(__('SD Card'))     + ' = ' + styleValue(device.emulator.sdcard || __('unknown')));
						result.push('  ' + rpad(__('Google APIs')) + ' = ' + styleValue(device.emulator.googleApis ? __('yes') : __('no')));
						break;

					case 'genymotion':
						name = 'Genymotion Emulator: ' + device.emulator.name;
						result.push('  ' + rpad(__('Genymotion Version'))  + ' = ' + styleValue(device.emulator.genymotion || __('unknown')));
						result.push('  ' + rpad(__('Display'))             + ' = ' + styleValue(device.emulator.display || __('unknown')));
						result.push('  ' + rpad(__('DPI'))                 + ' = ' + styleValue(device.emulator.dpi || __('unknown')));
						result.push('  ' + rpad(__('OpenGL Acceleration')) + ' = ' + styleValue(device.emulator.hardwareOpenGL ? __('yes') : __('no')));
						result.push('  ' + rpad(__('Google APIs'))         + ' = ' + styleValue(device.emulator.googleApis ? __('yes') : __('no')));
						break;
				}

				return name.cyan + '\n' + result.join('\n');
			} else {
				return name.cyan + '\n' + result.join('\n');
			}
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}
};