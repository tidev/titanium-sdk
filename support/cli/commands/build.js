/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	lib = require('./lib/common');

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
			dest: {
				alias: 'destination',
				default: 'device',
				desc: __('the destination to build for'),
				values: ['device', 'simulator|emulator', 'package']
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
		}, lib.commonOptions(logger, config))
	};
};

exports.validate = function (logger, config, cli) {
	cli.argv.platform = lib.validatePlatform(logger, cli.argv.platform);
	cli.argv.dir = lib.validateProjectDir(logger, cli.argv.dir);
};

exports.run = function (logger, config, cli) {
	dump(cli.argv);
	
	logger.log(__('Project built successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
};
