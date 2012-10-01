/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	ti = require('titanium-sdk'),
	path = require('path');

// TODO: need to support building modules... how do we know if --dir is a module or app? where is the module _build.js located?

exports.config = function (logger, config, cli) {
	return function (finished) {
		ti.platformOptions(logger, config, cli, 'build', function (platformConf) {
			finished({
				title: __('Build'),
				desc: __('builds a project'),
				extendedDesc: 'Builds an existing app or module project.',
				options: appc.util.mix({
					platform: {
						abbr: 'p',
						callback: function (value) {
							return ti.resolvePlatform(value);
						},
						desc: __('the target build platform'),
						hint: __('platform'),
						prompt: {
							label: __('Target platform [%s]', ti.availablePlatforms.join(',')),
							error: __('Invalid platform'),
							validator: function (platform) {
								platform = platform.trim();
								if (!platform) {
									throw new appc.exception(__('Invalid platform'));
								}
								if (ti.availablePlatforms.indexOf(platform) == -1) {
									throw new appc.exception(__('Invalid platform: %s', platform));
								}
								return true;
							}
						},
						required: true,
						values: ti.availablePlatforms
					},
					'project-dir': {
						abbr: 'd',
						desc: __('the directory containing the project, otherwise the current working directory')
					}
				}, ti.commonOptions(logger, config)),
				platforms: platformConf
			});
		});
	};
};

exports.validate = function (logger, config, cli) {
	ti.validatePlatform(logger, cli.argv, 'platform');
	if (ti.validatePlatformOptions(logger, config, cli, 'build') === false) {
		return false;
	}
};

exports.run = function (logger, config, cli) {
	var sdk = cli.env.getSDK(cli.argv.sdk),
		buildModule = path.join(path.dirname(module.filename), '..', '..', cli.argv.platform, 'cli', 'commands', '_build.js');
	
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	cli.fireHook('prebuild', function () {
		require(buildModule).run(logger, config, cli, function () {
			cli.fireHook('finalize', function () {
				logger.info(__('Project built successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
			});
		});
	});
};
