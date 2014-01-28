/*
 * create.js: Titanium Mobile CLI create command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var ti = require('titanium-sdk'),
	fields = require('fields'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs;

exports.cliVersion = '>=3.2';
exports.desc = __('creates a new mobile application or module');

exports.config = function (logger, config, cli) {
	return function (finished) {
		cli.createHook('create.config', function (callback) {
			var conf,
				idPrefix = config.get('app.idprefix'),
				availablePlatforms = {},
				validPlatforms = {};

			// build list of all valid platforms
			ti.platforms.forEach(function (p) {
				if (/^iphone|ios|ipad$/.test(p)) {
					validPlatforms['iphone'] = availablePlatforms['iphone'] = 1;
					validPlatforms['ipad'] = availablePlatforms['ipad'] = 1;
					validPlatforms['ios'] = 1;
				} else {
					validPlatforms[p] = availablePlatforms[p] = 1;
				}
			});

			// add "all"
			validPlatforms['all'] = 1;
			availablePlatforms = ['all'].concat(Object.keys(availablePlatforms));

			conf = {
				flags: {
					force: {
						abbr: 'f',
						desc: __('force project creation even if path already exists')
					}
				},
				options: appc.util.mix({
					id: {
						desc: __("the App ID in the format 'com.companyname.appname'"),
						order: 150,
						prompt: function (callback) {
							callback(fields.text({
								default: idPrefix ? idPrefix.replace(/\.$/, '') + '.' + cli.argv.name : undefined,
								promptLabel: __('App ID'),
								validate: function (value, callback) {
									conf.options.name.validate(value, function (err, value) {
										if (err) {
											logger.error(err.message + '\n');
											callback(true);
										} else {
											callback(null, value);
										}
									});
								}
							}));
						},
						required: true,
						validate: function (value, callback) {
							if (!value) {
								return callback(new Error(__('Please specify an app id')));
							}
/*
							// general app id validation
							if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(value)) {
								throw new appc.exception(__('Invalid app id "%s"', value), [
									__('The app id must consist of letters, numbers, dashes, and underscores.'),
									__('Note: Android does not allow dashes and iOS does not allow underscores.'),
									__('The first character must be a letter or underscore.'),
									__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)")
								]);
							}

							var scrubbed = ti.scrubPlatforms(cli.argv.platforms).scrubbed;
							if (scrubbed.indexOf('android') != -1) {
								if (id.indexOf('-') != -1) {
									throw new appc.exception(__('Invalid app id "%s"', id), [
										__('For apps targeting %s, the app id must not contain dashes.', 'Android'.cyan)
									]);
								}

								if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(id)) {
									throw new appc.exception(__('Invalid app id "%s"', id), [
										__('For apps targeting %s, numbers are not allowed directly after periods.', 'Android'.cyan)
									]);
								}

								if (!ti.validAppId(id)) {
									throw new appc.exception(__('Invalid app id "%s"', id), [
										__('For apps targeting %s, the app id must not contain Java reserved words.', 'Android'.cyan)
									]);
								}
							}

							if (scrubbed.indexOf('ios') != -1 || scrubbed.indexOf('iphone') != -1) {
								if (id.indexOf('_') != -1) {
									throw new appc.exception(__('Invalid app id "%s"', id), [
										__('For apps targeting %s, the app id must not contain underscores.', 'iOS'.cyan)
									]);
								}
							}
*/
							callback(null, value);
						}
					},
					name: {
						abbr: 'n',
						desc: __('the name of the project'),
						order: 140,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __('Project name'),
								validate: conf.options.name.validate
								/*
								function (value, callback) {
									(value, function (err, value) {
										if (err) {
											err.dump ? err.dump(logger.error) : logger.error(err.message);
											logger.log();
											callback(true);
										} else {
											callback(null, value);
										}
									});
								}
								*/
							}));
						},
						required: true,
						validate: function (value, callback) {
							if (!value) {
								throw new Error(__('Please specify a project name'));
							}

							// check the name
							if (cli.argv.platforms.indexOf('android') != -1 && value.indexOf('&') != -1) {
								throw new appc.exception(__('Ampersands (&) are not allowed in the project name when targeting Android'), [
									'sdfhi',
									'asdfwe'
								]);
							}

							callback(null, value);
						}
					},
					platforms: {
						abbr: 'p',
						desc: __('the target build platform'),
						order: 120,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __('Target platform (%s)', availablePlatforms.join('|')),
								default: 'all',
								validate: function (value, callback) {
									conf.options.platforms.validate(value, function (err, value) {
										if (err) {
											logger.error(err.message + '\n');
											callback(true);
										} else {
											callback(null, value);
										}
									});
								}
							}));
						},
						required: true,
						validate: function (value, callback) {
							var goodValues = {},
								badValues = {};

							// just in case they set -p without a value
							if (value === true) {
								value = 'all';
							}

							value.trim().toLowerCase().split(',').forEach(function (s) {
								if (s = s.trim()) {
									if (validPlatforms[s]) {
										goodValues[s] = 1;
									} else {
										badValues[s] = 1;
									}
								}
							});

							var badLen = Object.keys(badValues).length;
							if (badLen) {
								return callback(new Error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', badLen, Object.keys(badValues).join(', '))));
							}

							if (goodValues.ios) {
								goodValues.iphone = 1;
								goodValues.ipad = 1;
								delete goodValues.ios;
							}

							if (goodValues.all) {
								goodValues = {};
								availablePlatforms.forEach(function (p) {
									if (p != 'all') {
										goodValues[p] = 1;
									}
								});
							}

							callback(null, Object.keys(goodValues).join(','));
						}
					},
					template: {
						desc: __('the name of the project template to use'),
						default: 'default',
						order: 110,
						required: true
					},
					type: {
						abbr: 't',
						default: 'app',
						desc: __('the type of project to create'),
						order: 100,
						skipValueCheck: true,
						validate: function (value, callback) {
							callback(/^app|module$/.test(value) ? null : new Error(__('Invalid project type "%s"', value)));
						},
						values: ['app'] // , 'module']
					},
					url: {
						abbr: 'u',
						default: config.app.url || '',
						desc: __('your company/personal URL'),
						order: 160
					},
					'workspace-dir': {
						abbr: 'd',
						default: config.app.workspace || '',
						desc: __('the directory to place the project in'),
						order: 130,
						prompt: {
							label: __('Directory to place project'),
							error: __('Invalid directory'),
							validator: function (dir) {
								dir = afs.resolvePath(dir);
								if (!fs.existsSync(dir)) {
									throw new appc.exception(__('Specified directory does not exist'));
								}
								if (!afs.isDirWritable(dir)) {
									throw new appc.exception(__('Specified directory not writable'));
								}
								return true;
							}
						},
						required: !config.app.workspace || !fs.existsSync(afs.resolvePath(config.app.workspace))
					}
				}, ti.commonOptions(logger, config))
			};
			callback(null, conf);
		})(function (err, result) {
			finished(result);
		});
	};
};

exports.validate = function (logger, config, cli) {

console.log('starting validate()');
process.exit(0);

	var platforms = ti.scrubPlatforms(cli.argv.platforms);

	if (platforms.bad.length) {
		logger.error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', platforms.bad.length, platforms.bad.join(', ')) + '\n');
		logger.log(__('Available platforms for SDK version %s:', ti.manifest.sdkVersion) + '\n');
		ti.availablePlatformsNames.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}

	cli.argv.id = (cli.argv.id || '').trim();

	// general app id validation (we'll make sure there are no dashes for Android and no underscores for iOS later)
	if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(cli.argv.id)) {
		logger.error(__('Invalid app id "%s"', cli.argv.id) + '\n');
		logger.log(__('The app id must consist of letters, numbers, dashes, and underscores.'));
		logger.log(__('Note: Android does not allow dashes and iOS does not allow underscores.'));
		logger.log(__('The first character must be a letter or underscore.'));
		logger.log(__("Usually the app id is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
		process.exit(1);
	}

	if (platforms.scrubbed.indexOf('android') != -1) {
		// if android is in the list of platforms, we go down the lowest common denominator road
		if (cli.argv.id.indexOf('-') != -1) {
			logger.error(__('Invalid app id "%s"', cli.argv.id) + '\n');
			logger.log(__('For apps targeting %s, the app id must not contain dashes.', 'Android'.cyan) + '\n');
			process.exit(1);
		}

		if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(cli.argv.id)) {
			logger.error(__('Invalid app id "%s"', cli.argv.id) + '\n');
			logger.log(__('For apps targeting %s, numbers are not allowed directly after periods.', 'Android'.cyan) + '\n');
			process.exit(1);
		}

		if (!ti.validAppId(cli.argv.id)) {
			logger.error(__('Invalid app id "%s"', cli.argv.id) + '\n');
			logger.log(__('For apps targeting %s, the app id must not contain Java reserved words.', 'Android'.cyan) + '\n');
			process.exit(1);
		}
	} else {
		// android is not in the list of platforms
		var counter = 0;

		if (cli.argv.id.indexOf('-') != -1) {
			logger.warn(__('The specified app id is not compatible with the Android platform.'));
			logger.warn(__('Android does not allow dashes in the app id.'));
			counter++;
		}

		if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(cli.argv.id)) {
			counter || logger.warn(__('The specified app id is not compatible with the Android platform.'));
			logger.warn(__('Android does not allow numbers directly following periods in the app id.'));
			counter++;
		}

		if (!ti.validAppId(cli.argv.id)) {
			counter || logger.warn(__('The specified app id is not compatible with the Android platform.'));
			logger.warn(__('Android does not allow Java reserved words in the app id.'));
			counter++;
		}

		if (counter) {
			logger.warn(__('If you wish to add Android support, you will need to fix the <id> in the tiapp.xml.'));
			logger.log();
		}
	}

	// next we check if iOS contains any underscores
	if (cli.argv.id.indexOf('_') != -1) {
		if (platforms.scrubbed.indexOf('ios') != -1 || platforms.scrubbed.indexOf('iphone') != -1) {
			logger.error(__('Invalid app id "%s"', cli.argv.id) + '\n');
			logger.log(__('For apps targeting %s, the app id must not contain underscores.', 'iOS'.cyan) + '\n');
			process.exit(1);
		} else {
			logger.warn(__('The specified app id is not compatible with the iOS platform.'));
			logger.warn(__('iOS does not allow underscores in the app id.'));
			logger.warn(__('If you wish to add iOS support, you will need to fix the <id> in the tiapp.xml.'));
			logger.log();
		}
	}

	cli.argv.name = (cli.argv.name || '').trim();
	if (!cli.argv.name) {
		logger.error(__('Invalid project name "%s"', cli.argv.name) + '\n');
		logger.log(__('The project name must consist of letters, numbers, dashes, and underscores.'));
		logger.log(__('The first character must be a letter.') + '\n');
		process.exit(1);
	}

	cli.argv['workspace-dir'] = afs.resolvePath(cli.argv['workspace-dir'] || '.');

	var projectDir = path.join(cli.argv['workspace-dir'], cli.argv.name);
	if (!cli.argv.force && fs.existsSync(projectDir)) {
		logger.error(__('Project directory already exists: %s', projectDir) + '\n');
		logger.log(__("Run '%s' to overwrite existing project.", (cli.argv.$ + ' ' + process.argv.slice(2).join(' ') + ' --force').cyan) + '\n');
		process.exit(1);
	}
};

exports.run = function (logger, config, cli) {
	var projectName = cli.argv.name,
		platforms = ti.scrubPlatforms(cli.argv.platforms),
		id = cli.argv.id,
		type = cli.argv.type,
		url = cli.argv.url || '',
		sdk = cli.env.getSDK(cli.argv.sdk),
		projectDir = afs.resolvePath(cli.argv['workspace-dir'], projectName),
		templateDir = afs.resolvePath(sdk.path, 'templates', type, cli.argv.template),
		uuid = require('node-uuid'),
		projectConfig,
		analyticsPayload;

	fs.existsSync(projectDir) || wrench.mkdirSyncRecursive(projectDir);

	if (type == 'app') {
		logger.info(__('Creating Titanium Mobile application project'));

		afs.copyDirSyncRecursive(templateDir, projectDir, { logger: logger.debug });

		// read and populate the tiapp.xml
		projectConfig = new ti.tiappxml(projectDir + '/tiapp.xml');
		projectConfig.id = id;
		projectConfig.name = projectName;
		projectConfig.url = url;
		projectConfig.version = '1.0';
		projectConfig.guid = uuid.v4();
		projectConfig['deployment-targets'] = {};
		if (platforms.original.indexOf('ios') != -1) {
			platforms.original.indexOf('ipad') != -1 || platforms.original.push('ipad');
			platforms.original.indexOf('iphone') != -1 || platforms.original.push('iphone');
		}
		ti.availablePlatformsNames.forEach(function (p) {
			if (p != 'ios') {
				projectConfig['deployment-targets'][p] = platforms.original.indexOf(p) != -1;
			}
		});
		projectConfig['sdk-version'] = sdk.name;
		projectConfig.save(projectDir + '/tiapp.xml');

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

		afs.copyDirSyncRecursive(templateDir, projectDir, { logger: logger.debug });

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
			'platforms: ' + platforms.original.join(', ')
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
			platforms: platforms.original.join(', '),
			date: (new Date()).toDateString()
		};

		cli.addAnalyticsEvent('project.create.module', analyticsPayload);
	}

	platforms.scrubbed.forEach(function (platform) {
		var p = afs.resolvePath(path.dirname(module.filename), '..', '..', platform, 'cli', 'commands', '_create.js');
		if (fs.existsSync(p)) {
			logger.info(__('Copying "%s" platform resources', platform));
			require(p).run(logger, config, cli, projectConfig);
		}
	});

	logger.info(__("Project '%s' created successfully in %s", projectName.cyan, appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
};