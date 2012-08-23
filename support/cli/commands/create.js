/*
 * create.js: Titanium Mobile CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	appc = require('node-appc'),
	lib = require('./lib/common');

exports.config = function (logger, config, cli) {
	return {
		desc: __('creates a new mobile application or module'),
		flags: {
			force: {
				abbr: 'f',
				desc: __('force project creation even if path already exists')
			}
		},
		options: appc.util.mix({
			platforms: {
				abbr: 'p',
				desc: __('the target build platform'),
				prompt: {
					label: __('Target platforms'),
					error: __('Invalid list of target platforms'),
					validator: function (platforms) {
						var p = exports.scrubPlatforms(platforms);
						if (p.bad.length) {
							throw new appc.exception(__('Invalid platforms: %s', p.bad.join(', ')));
						}
						return true;
					}
				},
				required: true,
				values: lib.availablePlatforms
			},
			type: {
				abbr: 't',
				default: 'app',
				desc: __('the type of project to create'),
				values: ['app', 'module']
			},
			id: {
				desc: __("the App ID in the format 'com.companyname.appname'"),
				prompt: {
					label: __('App ID'),
					error: __('Invalid App ID'),
					pattern: /^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/
				},
				required: true
			},
			template: {
				desc: __('the name of the project template to use'),
				default: 'default'
			},
			name: {
				abbr: 'n',
				desc: __('the name of the project'),
				prompt: {
					label: __('Project name'),
					error: __('Invalid project name'),
					pattern: /\w+/
				},
				required: true
			},
			dir: {
				abbr: 'd',
				desc: __('the directory to place the project in'),
				prompt: {
					label: __('Directory to place project'),
					error: __('Invalid directory'),
					validator: function (dir) {
						dir = appc.fs.resolvePath(dir);
						if (!appc.fs.exists(dir)) {
							throw new appc.exception(__('Specified directory does not exist'));
						}
						if (!appc.fs.isDirWritable(dir)) {
							throw new appc.exception(__('Specified directory not writable'));
						}
						return true;
					}
				},
				required: true
			}
		}, lib.commonOptions(logger, config))
	};
};

exports.validate = function (logger, config, cli) {
	var platforms = lib.scrubPlatforms(cli.argv.platforms);
	cli.argv.platforms = platforms.scrubbed;
	
	if (platforms.bad.length) {
		logger.error(__('Invalid platforms: %s', platforms.bad.join(', ')) + '\n');
		logger.log(__('Available platforms for SDK version %s:', lib.sdkVersion) + '\n');
		lib.availablePlatforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
	
	var projectDir = appc.fs.resolvePath(cli.argv.dir, cli.argv.name);
	if (!cli.argv.force && appc.fs.exists(projectDir)) {
		logger.error(__('Project directory alread exists: %s', projectDir) + '\n');
		logger.log(__("Run '%s' to overwrite existing project.", (cli.argv.$ + ' ' + process.argv.slice(2).join(' ') + ' --force').cyan) + '\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	var projectName = cli.argv.name,
		platforms = cli.argv.platforms,
		sdk = cli.env.getSDK(cli.argv.sdk),
		projectDir = appc.fs.resolvePath(cli.argv.dir, projectName),
		templateDir = appc.fs.resolvePath(sdk.path, 'templates', cli.argv.template),
		tiappFile = path.join(projectDir, 'tiapp.xml');
	
	appc.fs.exists(projectDir) || wrench.mkdirSyncRecursive(projectDir);
	wrench.copyDirSyncRecursive(templateDir, projectDir);
	
	var tiapp = new appc.xml.tiapp(tiappFile);
	tiapp.set('id', cli.argv.id)
		.set('name', projectName)
		.set('version', '1.0')
		.set('deployment-targets', lib.availablePlatforms.map(function (p) {
			return {
				tag: 'target',
				attrs: { 'device': p },
				value: platforms.indexOf(p) != -1
			};
		}))
		.set('sdk-version', sdk.name)
		.save();
	
	platforms.forEach(function (p) {
		var templatePath = appc.fs.resolvePath('..', '..', p, 'templates', cli.argv.template);
		if (appc.fs.exists(templatePath)) {
			wrench.copyDirSyncRecursive(templatePath, projectDir, { preserve: true });
		}
		if (appc.fs.exists(appc.fs.resolvePath('..', '..', p, 'cli', 'commands', '_create.js'))) {
			require('../../' + p + '/cli/commands/_create')(logger, projectDir, tiapp);
		}
	});
	
	logger.log(__("Project '%s' created successfully in %s", projectName.cyan, appc.time.printDiff(cli.startTime, Date.now())) + '\n');
};