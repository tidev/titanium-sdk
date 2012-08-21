/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	manifest = appc.manifest(module);

exports.config = function (logger, config, cli) {
	return {
		title: __('Build'),
		desc: __('builds a project'),
		requiresAuth: true,
		options: {
			platform: {
				abbr: 'p',
				desc: __('the target build platform'),
				hint: __('platform'),
				values: manifest.platforms
			},
			sdk: {
				abbr: 's',
				default: 'latest',
				desc: __('Titanium SDK version to use'),
				hint: __('version')
			},
			'log-level': {
				callback: function (value) {
					logger.levels[value] && logger.setLevel(value);
				},
				desc: __('minimum logging level'),
				default: 'warn',
				hint: __('level'),
				values: Object.keys(logger.levels)
			}
		},
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
		},
		args: [
			{
				desc: __('the directory where the project is located'),
				name: 'project-dir',
				required: true
			}
		]
	};
};

exports.validate = function (logger, config, cli) {
	if (!cli.argv.hasOwnProperty('platform')) {
		logger.error(__('Missing required "platform" argument') + '\n');
		process.exit(1);
	}
	
	if (!~manifest.platforms.indexOf(cli.argv.platform)) {
		logger.error(__('Invalid platform "%s"', cli.argv.platform) + '\n');
		logger.log(__('Available platforms for SDK version %s:', manifest.version) + '\n');
		manifest.platforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
	
	if (cli.argv._.length == 0) {
		logger.error(__('Missing required argument "project-dir"') + '\n');
		process.exit(1);
	}
	
	var projectDir = cli.argv._[0];
	if (!appc.fs.exists(projectDir)) {
		logger.error(__('Project directory "%s" does not exist', projectDir) + '\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	dump(cli.argv);
	
	/*
	
	*/
};
