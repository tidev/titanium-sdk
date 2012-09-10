/*
 * run.js: Titanium Mobile CLI run command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	lib = require('./lib/common');

exports.config = function (logger, config, cli) {
	return {
		desc: __('install and run an app'),
		platforms: lib.platformOptions(logger, config, cli, module)
	};
};

exports.validate = function (logger, config, cli) {
	// TODO
};

exports.run = function (logger, config, cli) {
	var sdk = cli.env.getSDK(cli.argv.sdk),
		buildModule = path.join(path.dirname(module.filename), '..', '..', cli.argv.platform, 'cli', 'commands', '_run.js');
	
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific run command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}
	
	require(buildModule).run({
		logger: logger,
		config: config,
		cli: cli,
		sdkVersion: sdk.name,
		lib: lib,
		finished: function () {
			logger.info(__('Project run successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
		}
	});
};
