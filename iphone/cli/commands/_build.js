/*
 * build.js: Titanium IOS CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	appc = require('node-appc'),
	ios = appc.ios,
	hitch = appc.util.hitch,
	parallel = appc.async.parallel,
	series = appc.async.series,
	exec = require('child_process').exec;

function build(logger, config, cli, sdkVersion, lib, finished) {
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	this.env = {};
	
	parallel(this, [
		function (callback) {
			ios.detect(hitch(this, function (env) {
				this.env = env;
				logger.debug(__('Xcode installation: %s', env.xcodePath));
				logger.debug(__('Installed iOS SDKs: %s', env.sdks.join(', ')));
				logger.debug(__('Installed iOS Simulators: %s', env.simulators.join(', ')));
				logger.debug(__('iOS development certificates: %s', env.dev ? env.devNames.join(', ') : __('not found')));
				logger.debug(__('iOS distribution certificates: %s', env.dist ? env.distNames.join(', ') : __('not found')));
				logger.debug(__('iOS WWDR certificate: %s', env.wwdr ? __('installed') : __('not found')));
				callback();
			}));
		}
	], function () {
		if (!this.env.xcodePath) {
			logger.error(__('Unable to locate Xcode. Please verify that you have properly installed Xcode.') + '\n');
			return;
		}
		
		finished();
	});
}

build.prototype = {

	createXcodeProject: function() {
		// project = Projector(self.name,version,template_dir,project_dir,self.id)
		// project.create(template_dir,iphone_dir)
	}

};

module.exports = build;