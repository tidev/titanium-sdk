/*
 * run.js: Titanium Mobile CLI run command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	ti = require('titanium-sdk');

exports.config = function (logger, config, cli) {
	return {
		desc: __('install and run an app'),
		platforms: ti.platformOptions(logger, config, cli, module)
	};
};

exports.validate = function (logger, config, cli) {
	// TODO: validate run-specific options/arguments
	
	ti.validatePlatformOptions(logger, config, cli, 'run');
};

exports.run = function (logger, config, cli) {
	var sdk = cli.env.getSDK(cli.argv.sdk),
		buildModule = path.join(path.dirname(module.filename), '..', '..', cli.argv.platform, 'cli', 'commands', '_run.js');
	
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}
	
	require(buildModule).run(logger, config, cli, function () {
		logger.info(__('Project run successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
	});
};
