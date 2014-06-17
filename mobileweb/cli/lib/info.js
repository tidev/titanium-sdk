/*
 * info.js: Titanium Mobile Web Info Command Implementation
 *
 * Copyright (c) 2013-2014, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

 var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	windows = require('titanium-sdk/lib/windows');

exports.name = 'mobileweb';

exports.title = __('Mobile Web');

exports.detect = function (types, config, next) {
	if (process.platform != 'win32') {
		return next();
	}

	windows.detect(config, null, function (results) {
		if (results.issues.length) {
			this.issues = this.issues.concat(results.issues);
		}

		results.tisdk = path.basename((function scan(dir) {
			var file = path.join(dir, 'manifest.json');
			if (fs.existsSync(file)) {
				return dir;
			}
			dir = path.dirname(dir);
			return dir != '/' && scan(dir);
		}(__dirname)));

		appc.jdk.detect(config, null, function (jdkInfo) {
			if (!jdkInfo.executables.java) {
				this.issues.push({
					id: 'MOBILEWEB_JAVA_NOT_FOUND',
					type: 'error',
					message: __('Java not found.') + '\n'
						+ __("If you already have Java installed, make sure it's in the system PATH.") + '\n'
						+ __('Java can be downloaded and installed from %s.', '__http://appcelerator.com/jdk__')
				});
			}
			next(null, this.data = results);
		}.bind(this));
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	// Visual Studio
	logger.log(styleHeading(__('Microsoft (R) Visual Studio')));
	if (data.visualstudio && Object.keys(data.visualstudio).length) {
		Object.keys(data.visualstudio).sort().forEach(function (ver) {
			var supported = data.visualstudio[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
			logger.log(
				'  ' + String(ver).cyan + (data.visualstudio[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
				'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.visualstudio[ver].path) + '\n' +
				'  ' + rpad('  ' + __('CLR Version')) + ' = ' + styleValue(data.visualstudio[ver].clrVersion) + '\n' +
				'  ' + rpad('  ' + __('Windows Phone SDKs')) + ' = ' + styleValue(data.visualstudio[ver].wpsdk ? Object.keys(data.visualstudio[ver].wpsdk).join(', ') : __('not installed'))
			);
		});
		logger.log();
	} else {
		logger.log('  ' + __('No versions found').grey + '\n');
	}

	logger.log(styleHeading(__('Microsoft (R) Build Engine')));
	if (data.msbuild) {
		logger.log('  ' + rpad(__('MSBuild Version')) + ' = ' + styleValue(data.msbuild.version) + '\n');
	} else {
		logger.log('  ' + __('Not installed').grey + '\n');
	}

	logger.log(styleHeading(__('Microsoft (R) Windows Phone SDK')));
	if (data.windowsphone && Object.keys(data.windowsphone).length) {
		Object.keys(data.windowsphone).sort().forEach(function (ver) {
			var supported = data.windowsphone[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
			logger.log(
				'  ' + String(ver).cyan + (data.windowsphone[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
				'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.windowsphone[ver].path)
			);
		});
		logger.log();
	} else {
		logger.log('  ' + __('No versions found').grey + '\n');
	}

	if (data.windowsphone && Object.keys(data.windowsphone).some(function (ver) { return data.windowsphone[ver].supported; })) {
		Object.keys(data.windowsphone).sort().forEach(function (ver) {
			logger.log(styleHeading(__('Windows Phone v%s Devices & Emulators', ver)));
			var devices = data.windowsphone[ver].devices;
			if (devices) {
				logger.log(Object.keys(devices).map(function (id) {
					return '  ' + devices[id].cyan + '\n' +
						'  ' + rpad('  ' + __('ID')) + ' = ' + styleValue(id);
				}).join('\n') + '\n');
			} else {
				logger.log('  ' + __('None').grey + '\n');
			}
		});
	} else {
		logger.log(styleHeading(__('Windows Phone Devices & Emulators')));
		logger.log('  ' + __('None').grey + '\n');
	}

	logger.log(styleHeading(__('Windows PowerShell')));
	logger.log('  ' + rpad('  ' + __('Enabled')) + ' = ' + styleValue(data.powershell && data.powershell.enabled ? __('yes') : __('no')) + '\n');
};