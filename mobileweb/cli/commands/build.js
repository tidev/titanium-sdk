/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

exports.config = function (logger, config, cli) {
	return {
		title: __('Build'),
		desc: __('builds a project'),
		options: {
			platform: {
				abbr: 'p',
				desc: __('the target build platform')
			},
			sdk: {
				abbr: 's',
				default: 'latest',
				desc: __('Titanium SDK version to use')
			},
			user: {
				desc: __('user to log in as, if not already logged in')
			},
			password: {
				desc: __('the password to log in with')
			},
			'log-level': {
				callback: function (value) {
					logger.levels[value] && logger.setLevel(value);
				},
				desc: __('minimum logging level'),
				default: 'warn',
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
	if (cli.argv._.length == 0) {
		logger.error('missing required argument "project-dir"\n');
		process.exit(1);
	}
	
	var projectDir = cli.argv._[0];
	if (!require('appc.js').util.exists(projectDir)) {
		logger.error('project-dir does not exist\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	dump(cli.argv);
	
	/*
	
	*/
};
