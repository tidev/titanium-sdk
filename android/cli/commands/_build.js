/*
 * build.js: Titanium Android CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	appc = require('node-appc'),
	afs = appc.fs,
	targets = ['emulator', 'device', 'dist-appstore'];

exports.config = function (logger, config, cli) {
	return {
		flags: {
			'build-only': {
				abbr: 'b',
				default: false,
				desc: __('only perform the build; if true, does not install or run the app')
			},
			force: {
				abbr: 'f',
				default: false,
				desc: __('force a full rebuild')
			}
		},
		options: {
			'android-sdk': {
				abbr: 'A',
				default: config.android && config.android.sdkPath,
				desc: __('the path to the Android SDK'),
				hint: __('path'),
				prompt: {
					label: __('Android SDK path'),
					error: __('Invalid Android SDK path'),
					validator: function (dir) {
						if (!afs.exists(dir, 'platform-tools')) {
							throw new appc.exception(__('Invalid Android SDK path'));
						}
						if (!afs.exists(dir, 'platform-tools', 'adb') && !afs.exists(dir, 'platform-tools', 'adb.exe')) {
							throw new appc.exception(__('Invalid Android SDK installation: unable to find adb'));
						}
						return true;
					}
				},
				required: true
			},
			'deploy-type': {
				abbr: 'D',
				desc: __('the type of deployment; only used with target is %s or %s', 'emulator'.cyan, 'device'.cyan),
				hint: __('type'),
				values: ['production', 'test', 'development']
			},
			target: {
				abbr: 'T',
				callback: function (value) {
					// as soon as we know the target, toggle required options for validation
					switch (value) {
						case 'device':
							// ?
							break;
						
						case 'dist-appstore':
							// ?
							break;
					}
				},
				default: 'emulator',
				desc: __('the target to build for'),
				required: true,
				values: targets
			}
		}
	};
};

exports.validate = function (logger, config, cli) {
	ti.validateProjectDir(logger, cli.argv, 'project-dir');
	if (!ti.validateCorrectSDK(logger, config, cli, cli.argv['project-dir'])) {
		// we're running the build command for the wrong SDK version, gracefully return
		return false;
	}
};

exports.run = function (logger, config, cli, finished) {
	new build(logger, config, cli, finished);
};

function build(logger, config, cli, finished) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	dump(cli.argv);
	
	finished && finished();
}

build.prototype = {

	//

};