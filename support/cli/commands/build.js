/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	lib = require('./lib/common'),
	path = require('path');

exports.config = function (logger, config, cli) {
	return {
		title: __('Build'),
		desc: __('builds a project'),
		extendedDesc: 'Builds an existing app or module project.',
		options: appc.util.mix({
			'build-type': {
				abbr: 'b',
				default: 'development',
				desc: __('the type of build to perform'),
				hint: __('type'),
				values: ['production', 'development']
			},
			platform: {
				abbr: 'p',
				desc: __('the target build platform'),
				hint: __('platform'),
				prompt: {
					label: __('Target platform [%s]', lib.availablePlatforms.join(',')),
					error: __('Invalid platform'),
					validator: function (platform) {
						platform = platform.trim();
						if (!platform) {
							throw new appc.exception(__('Invalid platform'));
						}
						if (lib.availablePlatforms.indexOf(platform) == -1) {
							throw new appc.exception(__('Invalid platform: %s', platform));
						}
						return true;
					}
				},
				required: true,
				values: lib.availablePlatforms
			},
			dir: {
				abbr: 'd',
				desc: __('the directory containing the project, otherwise the current working directory')
			}
		}, lib.commonOptions(logger, config)),
		platforms: lib.platformOptions(logger, config, cli, 'build')
	};
};

exports.validate = function (logger, config, cli) {
	cli.argv.platform = lib.validatePlatform(logger, cli.argv.platform);
	cli.argv.dir = lib.validateProjectDir(logger, cli.argv.dir);
	lib.validatePlatformOptions(logger, config, cli, 'build');
};

exports.run = function (logger, config, cli) {
	var sdk = cli.env.getSDK(cli.argv.sdk),
		buildModule = path.join(path.dirname(module.filename), '..', '..', cli.argv.platform, 'cli', 'commands', '_build.js');
	
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}
	
	require(buildModule).run(logger, config, cli, {
		sdkVersion: sdk.name,
		lib: lib,
		finished: function () {
			logger.info(__('Project built successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
		}
	});
};
