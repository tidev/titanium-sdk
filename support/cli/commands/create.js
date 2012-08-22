/*
 * create.js: Titanium CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	appc = require('node-appc'),
	manifest = appc.manifest(module),
	platformAliases = {
		'ipad': 'iphone',
		'ios': 'iphone'
	};

exports.config = function (logger, config, cli) {
	return {
		desc: __('creates a new mobile application or module'),
		flags: {
			force: {
				abbr: 'f',
				desc: __('force project creation even if path already exists')
			}
		},
		options: {
			platforms: {
				abbr: 'p',
				desc: __('the target build platform'),
				required: true,
				values: manifest.platforms
			},
			type: {
				abbr: 't',
				default: 'app',
				desc: __('the type of project to create'),
				values: ['app', 'module']
			},
			id: {
				desc: __('the project ID'),
			},
			sdk: {
				abbr: 's',
				default: 'latest',
				desc: __('Titanium SDK version to use')
			},
			template: {
				desc: __('the name of the project template to use'),
				default: 'default'
			},
			dir: {
				abbr: 'd',
				desc: __('the directory to place the project in')
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
				values: logger.getLevels()
			}
		},
		args: [
			{
				desc: __('the name of the project'),
				name: 'project-name',
				required: true
			}
		]
	};
};

exports.validate = function (logger, config, cli) {
	if (!cli.argv.hasOwnProperty('platforms')) {
		logger.error(__('Missing required "platforms" argument') + '\n');
		process.exit(1);
	}
	
	var platforms = [],
		badPlatforms = [];
	
	cli.argv.platforms.toLowerCase().split(',').map(function (p) {
		return platformAliases[p] || p;
	}).forEach(function (p) {
		if (manifest.platforms.indexOf(p) == -1) {
			badPlatforms.push(p);
		} else if (platforms.indexOf(p) == -1) {
			platforms.push(p);
		}
	});
	cli.argv.platforms = platforms;
	
	if (badPlatforms.length) {
		logger.error(__('Invalid platforms: %s', badPlatforms.join(', ')) + '\n');
		logger.log(__('Available platforms for SDK version %s:', manifest.version) + '\n');
		manifest.platforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
	
	if (!cli.argv.hasOwnProperty('id')) {
		logger.error(__('Missing required "id" argument') + '\n');
		process.exit(1);
	}
	
	if (!cli.argv.hasOwnProperty('dir')) {
		logger.error(__('Missing required "dir" argument') + '\n');
		process.exit(1);
	}
	
	if (cli.argv._.length == 0) {
		logger.error(__('Missing required argument "project-name"') + '\n');
		process.exit(1);
	}
	
	var projectDir = appc.fs.resolvePath(cli.argv.dir, cli.argv._[0]);
	if (!cli.argv.force && appc.fs.exists(projectDir)) {
		logger.error(__('Project directory alread exists: %s', projectDir) + '\n');
		logger.log(__("Run '%s' to overwrite existing project.", (cli.argv.$ + ' ' + process.argv.slice(2).join(' ') + ' --force').cyan) + '\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	var projectName = cli.argv._[0],
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
		.set('deployment-targets', manifest.platforms.map(function (p) {
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