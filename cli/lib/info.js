/*
 * info.js: Titanium Mobile General SDK-Level "info" command module.
 *
 * Copyright (c) 2014, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

const
	appc = require('node-appc'),
	fs = require('fs'),
	path = require('path'),
	genymotion = require('titanium-sdk/lib/emulators/genymotion'),
	windowslib = require('windowslib'),
	__ = appc.i18n(__dirname).__;

exports.name = 'miscinfo';

exports.title = 'Misc Info';

exports.detect = function (types, config, callback) {
	var results = this.data = {},
		tisdk = path.basename((function scan(dir) {
			var file = path.join(dir, 'manifest.json');
			if (fs.existsSync(file)) {
				return dir;
			}
			dir = path.dirname(dir);
			return dir != '/' && scan(dir);
		}(__dirname)));

	appc.async.parallel(this, [
		function (next) {
			genymotion.detect(config, null, function (err, genymotionInfo) {
				if (err) {
					return next(err);
				}

				genymotionInfo.tisdk = tisdk;
				results.genymotion = genymotionInfo;

				if (genymotionInfo.issues.length) {
					this.issues = this.issues.concat(genymotionInfo.issues);
				}

				next();
			}.bind(this));
		},

		function (next) {
			if (process.platform !== 'win32') {
				return next();
			}

			// we are going to load Mobile Web's package.json to get the vendor dependencies.
			// this will probably cause issues when the Windows Phone platform is introduced.
			var packageJson = appc.pkginfo.package(module);

			windowslib.detect({
				powershell:                       config.get('windows.executables.powershell'),
				preferredWindowsPhoneSDK:         config.get('windows.wpsdk.selectedVersion'),
				preferredVisualStudio:            config.get('windows.visualstudio.selectedVersion'),
				supportedMSBuildVersions:         packageJson.vendorDependencies['msbuild'],
				supportedVisualStudioVersions:    packageJson.vendorDependencies['visual studio'],
				supportedWindowsPhoneSDKVersions: packageJson.vendorDependencies['windows phone sdk'],
				tasklist:                         config.get('windows.executables.tasklist')
			}, function (err, winInfo) {
				if (err) {
					return next(err);
				}

				// TIMOB-19076: Windows Phone 8.0 is not supported
				winInfo.windowsphone && delete winInfo.windowsphone['8.0'];
				winInfo.windows && delete winInfo.windows['8.0'];
				winInfo.emulators && delete winInfo.emulators['8.0'];

				results.tisdk = tisdk;
				results.windows = winInfo;

				if (winInfo.issues.length) {
					this.issues = this.issues.concat(winInfo.issues);
				}

				// improve error messages
				this.issues.forEach(function (issue) {
					switch (issue.id) {
						case 'WINDOWS_VISUAL_STUDIO_NOT_INSTALLED':
							issue.message += '\n' + __('You can install it from %s.', '__http://appcelerator.com/visualstudio__');
							break;
						case 'WINDOWS_PHONE_SDK_NOT_INSTALLED':
						case 'WINDOWS_PHONE_SDK_MISSING_DEPLOY_CMD':
							issue.message += '\n' + __('You can install it from %s.', '__http://appcelerator.com/windowsphone__');
							break;
					}
				});

				next();
			}.bind(this));
		}
	], function (err) {
		callback(err, results);
	});
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	logger.log(styleHeading(__('Genymotion')) + '\n' +
		'  ' + rpad(__('Path'))                  + ' = ' + styleValue(data.genymotion.path || __('not found')) + '\n' +
		'  ' + rpad(__('Genymotion Executable')) + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.genymotion || __('not found')) + '\n' +
		'  ' + rpad(__('Genymotion Player'))     + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.player || __('not found')) + '\n' +
		'  ' + rpad(__('Home'))                  + ' = ' + styleValue(data.genymotion.home || __('not found')) + '\n'
	);

	logger.log(styleHeading(__('VirtualBox')) + '\n' +
		'  ' + rpad(__('Executable')) + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.vboxmanage || __('not found')) + '\n' +
		'  ' + rpad(__('Version'))    + ' = ' + styleValue(data.genymotion.virtualbox || __('unknown')) + '\n'
	);

	if (process.platform === 'win32') {
		// Visual Studio
		logger.log(styleHeading(__('Microsoft (R) Visual Studio')));
		if (data.windows.visualstudio && Object.keys(data.windows.visualstudio).length) {
			Object.keys(data.windows.visualstudio).sort().forEach(function (ver) {
				var supported = data.windows.visualstudio[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
				logger.log(
					'  ' + String(ver).cyan + (data.windows.visualstudio[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
					'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.windows.visualstudio[ver].path) + '\n' +
					'  ' + rpad('  ' + __('CLR Version')) + ' = ' + styleValue(data.windows.visualstudio[ver].clrVersion) + '\n' +
					'  ' + rpad('  ' + __('MSBuild Version')) + ' = ' + styleValue('v' + data.windows.visualstudio[ver].msbuildVersion) + '\n' +
					'  ' + rpad('  ' + __('Windows Phone SDKs')) + ' = ' + styleValue(data.windows.visualstudio[ver].wpsdk ? Object.keys(data.windows.visualstudio[ver].wpsdk).join(', ') : __('not installed'))
				);
			});
			logger.log();
		} else {
			logger.log('  ' + __('No versions found').grey + '\n');
		}

		logger.log(styleHeading(__('Microsoft (R) Windows Phone SDK')));
		if (data.windows.windowsphone && Object.keys(data.windows.windowsphone).length) {
			Object.keys(data.windows.windowsphone).sort().forEach(function (ver) {
				var supported = data.windows.windowsphone[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
				logger.log(
					'  ' + String(ver).cyan + (data.windows.windowsphone[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
					'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.windows.windowsphone[ver].path)
				);
			});
			logger.log();
		} else {
			logger.log('  ' + __('No versions found').grey + '\n');
		}

		logger.log(styleHeading(__('Windows PowerShell')));
		logger.log('  ' + rpad('  ' + __('Enabled')) + ' = ' + styleValue(data.windows.powershell && data.windows.powershell.enabled ? __('yes') : __('no')) + '\n');

		logger.log(styleHeading(__('Windows Phone Emulators')));
		if (data.windows.emulators) {
			Object.keys(data.windows.emulators).forEach(function (ver) {
				logger.log(String(ver).grey);
				data.windows.emulators[ver].forEach(function (emu) {
					logger.log('  ' + emu.name.cyan);
					logger.log('  ' + rpad('  ' + __('UDID')) + ' ' + emu.udid.magenta);
				});
			});
			logger.log();
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}

		logger.log(styleHeading(__('Windows Phone Devices')));
		if (data.windows.devices) {
			data.windows.devices.forEach(function (dev) {
				logger.log('  ' + dev.name.cyan);
				logger.log('  ' + rpad('  ' + __('UDID')) + ' ' + String(dev.udid).magenta);
			});
			logger.log();
		} else {
			logger.log('  ' + __('None').grey + '\n');
		}
	}
};
