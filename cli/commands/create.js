/*
 * create.js: Titanium Mobile CLI create command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
	fields = require('fields'),
	fs = require('fs'),
	i18n = appc.i18n(__dirname),
	path = require('path'),
	ti = require('titanium-sdk'),
	wrench = require('wrench'),
	__ = i18n.__,
	__n = i18n.__n;

exports.cliVersion = '>=3.2';
exports.desc = __('creates a new mobile application'); // or module

exports.config = function config(logger, config, cli) {
	return function (finished) {
		cli.createHook('create.config', function (callback) {
			var conf,
				idPrefix = config.get('app.idprefix'),
				workspaceDir = config.app.workspace ? appc.fs.resolvePath(config.app.workspace) : null,
				availablePlatforms = {},
				validPlatforms = {};

			workspaceDir && !fs.existsSync(workspaceDir) && (workspaceDir = null);

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
								validate: conf.options.id.validate
							}));
						},
						required: true,
						validate: function (value, callback) {
							if (!value) {
								logger.error(__('Please specify an App ID') + '\n');
								return callback(true);
							}

							// general app id validation
							if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(value)) {
								logger.error(__('Invalid App ID "%s"', value));
								logger.error(__('The App ID must consist of letters, numbers, dashes, and underscores.'));
								logger.error(__('Note: Android does not allow dashes and iOS does not allow underscores.'));
								logger.error(__('The first character must be a letter or underscore.'));
								logger.error(__("Usually the App ID is your company's reversed Internet domain name. (i.e. com.example.myapp)") + '\n');
								return callback(true);
							}

							if (cli.argv.platforms.indexOf('android') != -1) {
								if (value.indexOf('-') != -1) {
									logger.error(__('Invalid App ID "%s"', value));
									logger.error(__('Dashes are not allowed in the App ID when targeting %s.', 'Android'.cyan) + '\n');
									return callback(true);
								}

								if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(value)) {
									logger.error(__('Invalid App ID "%s"', value));
									logger.error(__('Numbers are not allowed directly after periods when targeting %s.', 'Android'.cyan) + '\n');
									return callback(true);
								}

								if (!ti.validAppId(value)) {
									logger.error(__('Invalid App ID "%s"', value));
									logger.error(__('The app must not contain Java reserved words when targeting %s.', 'Android'.cyan) + '\n');
									return callback(true);
								}
							} else {
								// android is not in the list of platforms
								var counter = 0;

								if (value.indexOf('-') != -1) {
									logger.warn(__('The specified App ID is not compatible with the Android platform.'));
									logger.warn(__('Android does not allow dashes in the App ID.'));
									counter++;
								}

								if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(value)) {
									counter || logger.warn(__('The specified App ID is not compatible with the Android platform.'));
									logger.warn(__('Android does not allow numbers directly following periods in the App ID.'));
									counter++;
								}

								if (!ti.validAppId(value)) {
									counter || logger.warn(__('The specified App ID is not compatible with the Android platform.'));
									logger.warn(__('Android does not allow Java reserved words in the App ID.'));
									counter++;
								}

								counter && logger.warn(__('If you wish to add Android support, you will need to fix the <id> in the tiapp.xml.') + '\n');
							}

							if (value.indexOf('_') != -1) {
								if (cli.argv.platforms.indexOf('ios') != -1 || cli.argv.platforms.indexOf('iphone') != -1 || cli.argv.platforms.indexOf('ipad') != -1) {
									logger.error(__('Invalid App ID "%s"', value));
									logger.error(__('Underscores are not allowed in the App ID when targeting %s.', 'iOS'.cyan) + '\n');
									return callback(true);
								} else {
									logger.warn(__('The specified App ID is not compatible with the iOS platform.'));
									logger.warn(__('iOS does not allow underscores in the App ID.'));
									logger.warn(__('If you wish to add iOS support, you will need to fix the <id> in the tiapp.xml.') + '\n');
								}
							}

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
							}));
						},
						required: true,
						validate: function (value, callback) {
							if (!value) {
								logger.error(__('Please specify a project name') + '\n');
								return callback(true);
							}

							if (cli.argv.platforms.indexOf('android') != -1 && value.indexOf('&') != -1) {
								logger.error(__('Ampersands (&) are not allowed in the project name when targeting Android.'));
								logger.error(__('In order to use an ampersand, you must define the app name using i18n strings.'));
								logger.error(__('Refer to %s for more information.', 'http://appcelerator.com/i18n-app-name') + '\n');
								return callback(true);
							}

							if (!/^[a-zA-Z]/.test(value)) {
								logger.error(__('The first character of the project name must be a letter.') + '\n');
								return callback(true);
							}

							callback(null, value);
						}
					},
					platforms: {
						abbr: 'p',
						default: !cli.argv.prompt && 'all' || undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
						desc: __('the target build platform'),
						order: 120,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __('Target platform (%s)', availablePlatforms.join('|')),
								default: 'all',
								validate: conf.options.platforms.validate
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
								logger.error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', badLen, Object.keys(badValues).join(', ')) + '\n');
								return callback(true);
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
							callback(/^app|module$/.test(value) ? null : new Error(__('Invalid project type "%s"', value)), value);
						},
						values: ['app'] // , 'module']
					},
					url: {
						abbr: 'u',
						default: !cli.argv.prompt && config.get('app.url') || undefined,
						desc: __('your company/personal URL'),
						order: 160,
						prompt: function (callback) {
							callback(fields.text({
								default: config.get('app.url'),
								promptLabel: __('Your company/personal URL')
							}));
						},
						required: true,
						validate: function (value, callback) {
							callback(null, value);
						}
					},
					'workspace-dir': {
						abbr: 'd',
						default: !cli.argv.prompt && workspaceDir || undefined,
						desc: __('the directory to place the project in'),
						order: 170,
						prompt: function (callback) {
							callback(fields.file({
								complete: true,
								default: workspaceDir,
								ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
								ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
								promptLabel: __('Directory to place project'),
								showHidden: true,
								validate: conf.options['workspace-dir'].validate
							}));
						},
						required: true,
						validate: function (dir, callback) {
							if (!dir) {
								logger.error(__('Please specify the workspace directory') + '\n');
								return callback(true);
							}

							dir = appc.fs.resolvePath(dir);

							// check if the directory is writable
							var prev = null,
								curr = dir;
							while (curr != prev) {
								if (fs.existsSync(curr)) {
									if (appc.fs.isDirWritable(curr)) {
										break;
									} else {
										logger.error(__('Directory "%s" is not writable', curr) + '\n');
										return callback(true);
									}
								}

								prev = curr;
								curr = path.dirname(curr);
							}

							callback(null, dir);
						}
					}
				}, ti.commonOptions(logger, config))
			};
			callback(null, conf);
		})(function (err, result) {
			finished(result);
		});
	};
};

exports.validate = function validate(logger, config, cli) {
	// check if the project already exists
	if (cli.argv.name && !cli.argv.force) {
		var projectDir = path.join(cli.argv['workspace-dir'], cli.argv.name);
		if (fs.existsSync(projectDir)) {
			logger.error(__('Project already exists: %s', projectDir));
			logger.error(__('Either change the project name, workspace directory, or re-run this command with the --force flag.') + '\n');
			process.exit(1);
		}
	}
};

exports.run = function run(logger, config, cli, finished) {
	var projectName = cli.argv.name,
		projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], projectName),
		type = cli.argv.type;

	var creator;
	if (type == 'app') {
		creator = new (require('../lib/app-creator'))(logger, config, cli);
	} else if (type == 'module') {
		creator = new (require('../lib/module-creator'))(logger, config, cli);
	}

	if (!creator) {
		logger.error(__('Failed to initialize "%s" creator.', type));
		return finished();
	}

	cli.emit('create.pre', creator, function () {
		fs.existsSync(projectDir) || wrench.mkdirSyncRecursive(projectDir);

		creator.run(function (err) {
			if (err) {
				cli.emit('create.finalize', creator, function () {
					logger.error(__("Failed to create project '%s' in %s", creator.projectName.cyan, appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
					finished(err);
				});
			} else {
				async.series(creator.platforms.scrubbed.map(function (platform) {
					return function (next) {
						cli.emit('create.pre.platform.' + platform, creator, function (err) {
							if (err) {
								next(err);
							} else {
								var p = appc.fs.resolvePath(path.dirname(module.filename), '..', '..', platform, 'cli', 'commands', '_create.js');
								if (fs.existsSync(p)) {
									logger.info(__('Copying "%s" platform resources', platform));
									require(p).run(logger, config, cli, creator.projectConfig);
								}
								cli.emit('create.post.platform.' + platform, creator, next);
							}
						});
					};
				}), function (err) {
					cli.emit('create.post', creator, function () {
						cli.emit('create.finalize', creator, function () {
							if (err) {
								logger.error(__("Failed to create project '%s' in %s", creator.projectName.cyan, appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
							} else {
								logger.info(__("Project '%s' created successfully in %s", creator.projectName.cyan, appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
							}
							finished(err);
						});
					});
				});
			}
		});
	});
};

