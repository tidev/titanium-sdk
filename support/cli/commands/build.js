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
		options: appc.util.mix({
			platform: {
				abbr: 'p',
				desc: __('the target build platform'),
				hint: __('platform'),
				prompt: {
					label: __('Platform to build for [%s]', lib.availablePlatforms.join(',')),
					validator: function (platform) {
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
		flags: {
			device: {
				desc: __('builds the project for device')
			},
			package: {
				desc: __('packages the project into a submittable binary or distributable zip file')
			},
			development: {
				desc: __('builds in development mode'),
				default: true
			},
			production: {
				desc: __('builds in production mode')
			},
			simulator: {
				alias: 'emulator',
				desc: __('builds the project to run on a development machine')
			}
		}
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
