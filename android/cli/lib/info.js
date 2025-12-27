import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'android';

export const title = 'Android';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function detect(types, config, next) {
	const tisdk = path.basename((function scan(dir) {
		const file = path.join(dir, 'manifest.json');
		if (fs.existsSync(file)) {
			return dir;
		}
		dir = path.dirname(dir);
		return dir !== '/' && scan(dir);
	}(__dirname)));

	import('./detect.js').then(({ default: mod }) => {
		// detect Android environment
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
	}).catch(next);
}

export function render(logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) {
		return;
	}

	logger.log(styleHeading('Android SDK') + '\n'
		+ '  ' + rpad('Android Executable') + ' = ' + styleValue(data.sdk && data.sdk.executables.android || 'not found') + '\n'
		+ '  ' + rpad('ADB Executable')     + ' = ' + styleValue(data.sdk && data.sdk.executables.adb || 'not found') + '\n'
		+ '  ' + rpad('SDK Path')           + ' = ' + styleValue(data.sdk && data.sdk.path || 'not found') + '\n'
	);

	logger.log(styleHeading('Android NDK') + '\n'
		+ '  ' + rpad('NDK Path')           + ' = ' + styleValue(data.ndk && data.ndk.path || 'not found') + '\n'
		+ '  ' + rpad('NDK Version')        + ' = ' + styleValue(data.ndk && data.ndk.version || 'not found') + '\n'
	);

	let androidPlatforms = '',
		androidAddons = '';
	const apiLevelMap = {};

	if (data.targets && Object.keys(data.targets).length) {
		Object.keys(data.targets).forEach(function (targetId) {
			var target = data.targets[targetId],
				supported = (target.supported === 'maybe'
					? (` (not supported by Titanium SDK ${data.tisdk}, but may work)`).yellow
					: target.supported
						? ''
						: styleBad(` **Not supported by Titanium SDK ${data.tisdk}**`));

			if (target.type === 'platform') {
				const m = target.name.match(/Android\s+(\d(?:\.\d(?:\.\d)?)?)/);
				if (m) {
					apiLevelMap[m[1]] = target['api-level'];
				}
				androidPlatforms += '  ' + (targetId + ') ' + target.id).cyan + '\n'
					+ '  ' + rpad('  Name')        + ' = ' + styleValue(target.name) + supported + '\n'
					+ '  ' + rpad('  API Level')   + ' = ' + styleValue(target['api-level']) + '\n'
					+ '  ' + rpad('  Revision')    + ' = ' + styleValue(target.revision) + '\n'
					+ '  ' + rpad('  Skins')       + ' = ' + styleValue(target.skins.join(', ')) + '\n'
					+ '  ' + rpad('  ABIs')        + ' = ' + styleValue(target.abis.join(', ')) + '\n'
					+ '  ' + rpad('  Path')        + ' = ' + styleValue(target.path) + '\n';
			} else if (target.type === 'add-on') {
				androidAddons += '  ' + (targetId + ') ' + target.id).cyan + '\n'
					+ '  ' + rpad('  Name')        + ' = ' + styleValue(target.name
						+ ' (' + (target['based-on'] ? `Android ${target['based-on']['android-version']} (API level ${target['based-on']['api-level']})` : 'unknown') + ')') + supported + '\n'
					+ '  ' + rpad('  Vendor')      + ' = ' + styleValue(target.vendor || 'n/a') + '\n'
					+ '  ' + rpad('  Revision')    + ' = ' + styleValue(target.revision) + '\n'
					+ '  ' + rpad('  Description') + ' = ' + styleValue(target.description || 'n/a') + '\n'
					+ '  ' + rpad('  Skins')       + ' = ' + styleValue(target.skins && target.skins.length ? target.skins.join(', ') : 'none') + '\n'
					+ '  ' + rpad('  ABIs')        + ' = ' + styleValue(target.abis && target.abis.length ? target.abis.join(', ') : 'none') + '\n'
					+ '  ' + rpad('  Path')        + ' = ' + styleValue(target.path) + '\n';

				if (target.libraries && Object.keys(target.libraries).length) {
					Object.keys(target.libraries).forEach(function (lib, i) {
						androidAddons += '  ' + (i === 0 ? rpad('  Libraries')   + ' = ' : rpad('') + '   ')
							+ styleValue(lib + ': ' + target.libraries[lib].description + ' (' + target.libraries[lib].jar + ')') + '\n';
					});
					androidAddons += '\n';
				} else {
					androidAddons += '  ' + rpad('  Libraries')   + ' = ' + styleValue('none') + '\n';
				}
			}
		});
	}

	logger.log(styleHeading('Android Platforms') + '\n' + (androidPlatforms ? androidPlatforms : '  ' + 'none'.grey + '\n'));
	logger.log(styleHeading('Android Add-Ons') + '\n' + (androidAddons ? androidAddons : '  ' + 'none'.grey + '\n'));

	logger.log(styleHeading('Android Emulators'));
	if (data.emulators) {
		const emus = data.emulators.filter(function (e) {
			return e.type === 'avd';
		});
		if (emus.length) {
			logger.log(emus.map(function (emu) {
				return '  ' + emu.name.cyan + '\n'
					+ '  ' + rpad('  ID')          + ' = ' + styleValue(emu.id) + '\n'
					+ '  ' + rpad('  SDK Version') + ' = ' + styleValue(emu.target || 'not installed') + '\n'
					+ '  ' + rpad('  ABI')         + ' = ' + styleValue(emu.abi) + '\n'
					+ '  ' + rpad('  Skin')        + ' = ' + styleValue(emu.skin) + '\n'
					+ '  ' + rpad('  Path')        + ' = ' + styleValue(emu.path) + '\n'
					+ '  ' + rpad('  SD Card')     + ' = ' + styleValue(emu.sdcard || 'no sd card') + '\n'
					+ (emu['based-on']
						? '  ' + rpad('  Based On')    + ' = ' + styleValue(`Android ${emu['based-on']['android-version']} (API level ${emu['based-on']['api-level']})`) + '\n'
						: ''
					)
					+ '  ' + rpad('  Google APIs') + ' = ' + styleValue(emu.googleApis ? 'yes' : 'no');
			}).join('\n') + '\n');
		} else {
			logger.log('  ' + 'none'.grey + '\n');
		}
	} else {
		logger.log('  ' + 'none'.grey + '\n');
	}

	logger.log(styleHeading('Connected Android Devices'));
	if (data.devices && data.devices.length) {
		logger.log(data.devices.map(function (device) {
			var name = device.name,
				result = [
					'  ' + rpad('ID')          + ' = ' + styleValue(device.id),
					'  ' + rpad('State')       + ' = ' + styleValue(device.state)
				];

			if (device.release) {
				result.push('  ' + rpad('SDK Version') + ' = ' + styleValue(device.release + ' (android-' + device.sdk + ')'));
			}

			if (Array.isArray(device.abi)) {
				result.push('  ' + rpad('ABIs')        + ' = ' + styleValue(device.abi.join(', ')));
			}

			if (device.emulator) {
				switch (device.emulator.type) {
					case 'avd':
						name = 'Android Emulator: ' + device.emulator.name;
						result.push('  ' + rpad('Skin')        + ' = ' + styleValue(device.emulator.skin || 'unknown'));
						result.push('  ' + rpad('SD Card')     + ' = ' + styleValue(device.emulator.sdcard || 'unknown'));
						result.push('  ' + rpad('Google APIs') + ' = ' + styleValue(device.emulator.googleApis ? 'yes' : 'no'));
						break;
				}

				return name.cyan + '\n' + result.join('\n');
			} else {
				return name.cyan + '\n' + result.join('\n');
			}
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + 'none'.grey + '\n');
	}
}
