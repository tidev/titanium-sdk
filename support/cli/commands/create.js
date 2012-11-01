/*
 * create.js: Titanium Mobile CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs;

exports.cliVersion = '>=3.X';
exports.desc = __('creates a new mobile application or module');

exports.config = function (logger, config, cli) {
	return {
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
					default: ti.availablePlatformsNames,
					label: __('Target platforms'),
					error: __('Invalid list of target platforms'),
					validator: function (platforms) {
						var p = ti.scrubPlatforms(platforms);
						if (p.bad.length) {
							throw new appc.exception(__('Invalid platforms: %s', p.bad.join(', ')));
						}
						return true;
					},
				},
				required: true,
				values: ti.availablePlatformsNames,
				skipValueCheck: true // we do our own validation
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
					pattern: /^[A-Za-z]+[A-Za-z0-9_-]*$/
				},
				required: true
			},
			'workspace-dir': {
				abbr: 'd',
				default: config.app.workspace || '',
				desc: __('the directory to place the project in'),
				prompt: {
					label: __('Directory to place project'),
					error: __('Invalid directory'),
					validator: function (dir) {
						dir = afs.resolvePath(dir);
						if (!afs.exists(dir)) {
							throw new appc.exception(__('Specified directory does not exist'));
						}
						if (!afs.isDirWritable(dir)) {
							throw new appc.exception(__('Specified directory not writable'));
						}
						return true;
					}
				},
				required: !config.app.workspace || !afs.exists(afs.resolvePath(config.app.workspace))
			}
		}, ti.commonOptions(logger, config))
	};
};

exports.validate = function (logger, config, cli) {
	var platforms = ti.scrubPlatforms(cli.argv.platforms);
	cli.argv.platforms = platforms.scrubbed;
	
	if (platforms.bad.length) {
		logger.error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', platforms.bad.length, platforms.bad.join(', ')) + '\n');
		logger.log(__('Available platforms for SDK version %s:', ti.manifest.sdkVersion) + '\n');
		ti.availablePlatforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
	
	cli.argv['workspace-dir'] = afs.resolvePath(cli.argv['workspace-dir'] || '.');
	
	var projectDir = path.join(cli.argv['workspace-dir'], cli.argv.name);
	if (!cli.argv.force && afs.exists(projectDir)) {
		logger.error(__('Project directory already exists: %s', projectDir) + '\n');
		logger.log(__("Run '%s' to overwrite existing project.", (cli.argv.$ + ' ' + process.argv.slice(2).join(' ') + ' --force').cyan) + '\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	var projectName = cli.argv.name,
		platforms = cli.argv.platforms,
		id = cli.argv.id,
		type = cli.argv.type,
		sdk = cli.env.getSDK(cli.argv.sdk),
		projectDir = afs.resolvePath(cli.argv['workspace-dir'], projectName),
		templateDir = afs.resolvePath(sdk.path, 'templates', type, cli.argv.template),
		uuid = require('node-uuid'),
		projectConfig,
		analyticsPayload;
	
	afs.exists(projectDir) || wrench.mkdirSyncRecursive(projectDir);
	wrench.copyDirSyncRecursive(templateDir, projectDir);
	
	if (type == 'app') {
		logger.info(__('Creating Titanium Mobile application project'));
		
		// read and populate the tiapp.xml
		projectConfig = new ti.tiappxml(projectDir + '/tiapp.xml');
		projectConfig.id = id;
		projectConfig.name = projectName;
		projectConfig.version = '1.0';
		projectConfig.guid = uuid.v4();
		projectConfig['deployment-targets'] = {};
		if (platforms.indexOf('ios') != -1) {
			platforms.indexOf('ipad') != -1 || platforms.push('ipad');
			platforms.indexOf('iphone') != -1 || platforms.push('iphone');
		}
		ti.availablePlatformsNames.forEach(function (p) {
			if (p != 'ios') {
				projectConfig['deployment-targets'][p] = platforms.indexOf(p) != -1;
			}
		});
		projectConfig['sdk-version'] = sdk.name;
		projectConfig.save(projectDir + '/tiapp.xml');
		
		// create the manifest file
		fs.writeFileSync(projectDir + '/manifest', [
			'#appname: ' + projectName,
			'#appid: ' + id,
			'#type: mobile',
			'#guid: ' + projectConfig.guid,
			'#version: ' + projectConfig.version,
			'#publisher: not specified',
			'#url: not specified',
			'#image: appicon.png',
			'#desc: not specified'
		].join('\n'));

		analyticsPayload = {
			dir: projectDir,
			name: projectName,
			publisher: projectConfig.publisher,
			url: projectConfig.url,
			image: projectConfig.image,
			appid: id,
			description: projectConfig.description,
			type: 'mobile',
			guid: projectConfig.guid,
			version: projectConfig.version,
			copyright: projectConfig.copyright,
			runtime: '1.0',
			date: (new Date()).toDateString()
		};
		
		cli.addAnalyticsEvent('project.create.mobile', analyticsPayload);
	} else if (type == 'module') {
		logger.info(__('Creating Titanium Mobile module project'));
		
		projectConfig = {
			'___PROJECTNAMEASIDENTIFIER___': projectName.toLowerCase().split(/\./).map(function (s) { return appc.string.capitalize(s); }).join(''),
			'___MODULE_NAME_CAMEL___': projectName.toLowerCase().split(/[\W_]/).map(function (s) { return appc.string.capitalize(s); }).join(''),
			'___MODULE_ID_AS_FOLDER___': id.replace(/\./g, path.sep),
			'___PROJECTNAME___': projectName.toLowerCase(),
			'__MODULE_ID__': id,
			'__PROJECT_SHORT_NAME__': projectName,
			'__VERSION__': sdk.name,
			'__SDK__': sdk.path,
			'__SDK_ROOT__': sdk.path,
			'__GUID__': uuid.v4(),
			'__YEAR__': (new Date).getFullYear()
		};
		
		// create the manifest file
		fs.writeFileSync(projectDir + '/manifest', [
			'#',
			'# this is your module manifest and used by Titanium',
			'# during compilation, packaging, distribution, etc.',
			'#',
			'version: 1.0',
			'apiversion: 2',
			'description: ' + projectName,
			'author: ' + ((config.user && config.user.name) || 'Your Name'),
			'license: Specify your license',
			'copyright: Copyright (c) 2012 by ' + ((config.user && config.user.name) || 'Your Company'),
			'',
			'# these should not be edited',
			'name: ' + projectName,
			'moduleid: ' + id,
			'guid: ' + projectConfig.__GUID__,
			'platforms: ' + platforms.sort().join(', ')
		].join('\n'));

		analyticsPayload = {
			dir: projectDir,
			name: projectName,
			author: ((config.user && config.user.name) || 'Your Name'),
			moduleid: id,
			description: projectName,
			guid: projectConfig.__GUID__,
			version: '1.0',
			copyright: 'copyright: Copyright (c) 2012 by ' + ((config.user && config.user.name) || 'Your Company'),
			minsdk: sdk.name,
			platforms: platforms.sort().join(', '),
			date: (new Date()).toDateString()
		};
		
		cli.addAnalyticsEvent('project.create.module', analyticsPayload);
	}
	
	platforms.forEach(function (platform) {
		var p = afs.resolvePath(path.dirname(module.filename), '..', '..', platform, 'cli', 'commands', '_create.js');
		if (afs.exists(p)) {
			require(p).run(logger, config, cli, projectConfig);
		}
	});
	
	logger.info(__("Project '%s' created successfully in %s", projectName.cyan, appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
};