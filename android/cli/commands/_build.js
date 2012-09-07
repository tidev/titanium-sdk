/*
 * build.js: Titanium Android CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs;

exports.config = function (logger, config, cli) {
	return {
		options: {
			'android-sdk': {
				abbr: 'a',
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
			}
		}
	};
};

exports.validate = function (logger, config, cli) {
	//
};

exports.run = function (logger, config, cli, opts) {
	new build(logger, config, cli, opts);
};

function build(logger, config, cli, opts) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	dump(cli.argv);
	
	opts.finished && opts.finished();
}

build.prototype = {

	//

};