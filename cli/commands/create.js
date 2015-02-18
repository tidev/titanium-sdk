/**
 * @overview
 * Create project command responsible for making the project directory and
 * copying template files.
 *
 * @copyright
 * Copyright (c) 2012-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	fields = require('fields'),
	fs = require('fs'),
	http = require('http'),
	i18n = appc.i18n(__dirname),
	path = require('path'),
	request = require('request'),
	temp = require('temp'),
	ti = require('titanium-sdk'),
	wrench = require('wrench'),
	__ = i18n.__,
	__n = i18n.__n;

exports.cliVersion = '>=3.2.1';
exports.desc = __('creates a new mobile application'); // or module

/**
 * Encapsulates the create command's state.
 * @class
 * @classdesc Implements the CLI command interface for the create command.
 * @constructor
 */
function CreateCommand() {
	var creatorDir = path.join(__dirname, '..', 'lib', 'creators'),
		types = this.types = {},
		jsRegExp = /\.js$/;

	fs.readdirSync(creatorDir).forEach(function (filename) {
		if (jsRegExp.test(filename)) {
			var mod = require(path.join(creatorDir, filename));
			types[mod.type || filename.replace(jsRegExp, '')] = mod;
		}
	});
}

/**
 * Defines the create command's CLI configuration.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
CreateCommand.prototype.config = function config(logger, config, cli) {
	this.logger = logger;
	this.config = config;
	this.cli = cli;

	fields.setup({ colors: cli.argv.colors });

	return function (finished) {
		cli.createHook('create.config', this, function (callback) {
			var conf,
				idPrefix = config.get('app.idprefix'),
				workspaceDir = config.app.workspace ? appc.fs.resolvePath(config.app.workspace) : null,
				types = this.types;

			workspaceDir && !fs.existsSync(workspaceDir) && (workspaceDir = null);

			conf = {
				flags: {
					'force': {
						abbr: 'f',
						desc: __('force project creation even if path already exists')
					}
				},
				options: appc.util.mix({
					'id': {
						desc: __("the App ID in the format 'com.companyname.appname'"),
						order: 150,
						prompt: function (callback) {
							var defaultValue = undefined,
								name = cli.argv.name.replace(/[ -]/g, '_').replace(/[^a-zA-Z0-9_]/g, '').replace(/_+/g, '_');
							if (idPrefix) {
								defaultValue = idPrefix.replace(/\.$/, '') + '.' + (/^[a-zA-Z]/.test(name) || (cli.argv.type == 'app' && cli.argv.platforms.indexOf('android') == -1) ? '' : 'my') + name;
							}

							callback(fields.text({
								default: defaultValue,
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

							if (cli.argv.type != 'app' || cli.argv.platforms.indexOf('android') != -1) {
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
								if (cli.argv.type != 'app' || cli.argv.platforms.indexOf('ios') != -1 || cli.argv.platforms.indexOf('iphone') != -1 || cli.argv.platforms.indexOf('ipad') != -1) {
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
					'name': {
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

							if ((cli.argv.type != 'app' || cli.argv.platforms.indexOf('android') != -1) && value.indexOf('&') != -1) {
								if (config.get('android.allowAppNameAmpersands', false)) {
									logger.warn(__('The project name contains an ampersand (&) which will most likely cause problems.'));
									logger.warn(__('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.'));
									logger.warn(__('Refer to %s for more information.', 'http://appcelerator.com/i18n-app-name'.cyan));
								} else {
									logger.error(__('The project name contains an ampersand (&) which will most likely cause problems.'));
									logger.error(__('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.'));
									logger.error(__('Refer to %s for more information.', 'http://appcelerator.com/i18n-app-name'));
									logger.error(__('To allow ampersands in the app name, run:'));
									logger.error('    ti config android.allowAppNameAmpersands true\n');
									return callback(true);
								}
							}

							callback(null, value);
						}
					},
					'platforms': {
						abbr: 'p',
						default: !cli.argv.prompt && 'all' || undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
						desc: __('one or more target platforms; values vary by project type:') + '\n' +
								Object.keys(types).map(function (type) {
									return '\u2022 ' + appc.string.rpad(type + ':', 7) + (' [' + types[type].availablePlatforms.join(', ') + ']').grey;
								}).join('\n'),
						order: 120,
						prompt: function (callback) {
							callback(fields.text({
								promptLabel: __('Target platform (%s)', types[cli.argv.type].availablePlatforms.join('|')),
								default: 'all',
								validate: conf.options.platforms.validate
							}));
						},
						required: true,
						validate: function (value, callback) {
							var goodValues = {},
								badValues = {};

							// just in case they set -p or --platforms without a value
							if (value === true || value === '') {
								logger.error(__('Invalid platforms value "%s"', value) + '\n');
								return callback(true);
							}

							value.trim().toLowerCase().split(',').forEach(function (s) {
								if (s = s.trim()) {
									if (types[cli.argv.type].validPlatforms[s]) {
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
								types[cli.argv.type].availablePlatforms.forEach(function (p) {
									if (p != 'all') {
										goodValues[p] = 1;
									}
								});
							}

							callback(null, Object.keys(goodValues).join(','));
						}
					},
					'template': {
						desc: __('the name of the project template, path to template dir, path to zip file, or url to zip file'),
						default: 'default',
						order: 110,
						required: true
					},
					'type': {
						abbr: 't',
						default: cli.argv.prompt ? undefined : 'app',
						desc: __('the type of project to create'),
						order: 100,
						prompt: function (callback) {
							callback(fields.select({
								title: __("What type of project would you like to create?"),
								promptLabel: __('Select a type by number or name'),
								default: 'app',
								margin: '',
								numbered: true,
								relistOnError: true,
								complete: true,
								suggest: false,
								options: Object.keys(types)
							}));
						}.bind(this),
						required: true,
						values: Object.keys(types)
					},
					'url': {
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
						required: !!cli.argv.prompt,
						validate: function (value, callback) {
							if (!value) {
								logger.error(__('The url value is "%s"', value) + '\n');
								return callback(true);
							}

							Array.isArray(value) ? callback(null, value[value.length-1]) : callback(null, value);
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
								default: workspaceDir || '.',
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
		}.bind(this))(function (err, result) {
			finished(result);
		});
	}.bind(this);
};

/**
 * Validates the create command's state.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
CreateCommand.prototype.validate = function validate(logger, config, cli) {
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

/**
 * Performs the project creation including making the project directory and copying
 * the project template files.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 * @param {Function} finished - A callback to fire when the project has been created
 */
CreateCommand.prototype.run = function run(logger, config, cli, finished) {
	var projectName = cli.argv.name,
		projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], projectName),
		type = cli.argv.type,
		creator;

	// load the project type lib
	creator = new this.types[type](logger, config, cli);
	logger.info(__('Creating %s project', type));

	appc.async.series(this, [
		function (next) {
			cli.emit([
				'create.pre',
				'create.pre.' + type
			], creator, next);
		},

		function (next) {
			fs.existsSync(projectDir) || wrench.mkdirSyncRecursive(projectDir);
			next();
		},

		function (next) {
			// try to resolve the template dir
			var template = cli.argv.template || 'default',
				builtinTemplateDir = appc.fs.resolvePath(creator.sdk.path, 'templates', type, template);

			if (fs.existsSync(builtinTemplateDir)) {
				creator.templateDir = builtinTemplateDir;
				return next();
			}

			if (/^https?\:\/\/.+/.test(template)) {
				return this.downloadFile(template, function (err, dir) {
					if (!err) {
						creator.templateDir = dir;
					}
					next(err);
				});
			}

			if (/\.zip$/.test(template) && fs.existsSync(template)) {
				return this.unzipFile(template, function (err, dir) {
					if (!err) {
						creator.templateDir = dir;
					}
					next(err);
				});
			}

			// could be the name of a template in one of the template paths
			var searchPaths = [],
				additionalPaths = config.get('paths.templates'),
				dir;

			cli.env.os.sdkPaths.forEach(function (dir) {
				if (fs.existsSync(dir = appc.fs.resolvePath(dir, 'templates')) && searchPaths.indexOf(dir) == -1) {
					searchPaths.push(dir);
				}
			});

			(Array.isArray(additionalPaths) ? additionalPaths : [ additionalPaths ]).forEach(function (p) {
				if (p && fs.existsSync(p = appc.fs.resolvePath(p)) && searchPaths.indexOf(p) == -1) {
					searchPaths.push(p);
				}
			});

			while (dir = searchPaths.shift()) {
				if (fs.existsSync(dir = path.join(dir, template))) {
					creator.templateDir = dir;
					return next();
				}
			}

			// last possibility is it's a local directory
			if (fs.existsSync(template) && fs.statSync(template).isDirectory()) {
				creator.templateDir = template;
				return next();
			}

			logger.error(__('Unable to find template "%s"', template));
			next(true);
		},

		function (next) {
			// load the template hooks, if applicable
			cli.scanHooks(path.join(creator.templateDir, 'hooks'));
			next();
		},

		function (next) {
			creator.run(function (err) {
				if (err) {
					next(err);
				} else {
					cli.emit([
						'create.post.' + type,
						'create.post'
					], creator, next);
				}
			});
		}
	], function (err) {
		// clean up the temp dir
		if (this.tempUnzipDir && fs.existsSync(this.tempUnzipDir)) {
			logger.debug(__('Removing temp unzip dir: %s', this.tempUnzipDir.cyan));
			wrench.rmdirSyncRecursive(this.tempUnzipDir);
		}

		cli.emit('create.finalize', creator, function () {
			if (err) {
				logger.error(__('Failed to create project after %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
			} else {
				logger.info(__('Project created successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
			}
			finished(err);
		});
	});
};

/**
 * Downloads the specified file and unzips it.
 * @param {String} url - The URL of a zip file to download
 * @param {Function} callback - The function to call after the file has been downloaded and unzipped
 */
CreateCommand.prototype.downloadFile = function downloadFile(url, callback) {
	var _t = this,
		tempName = temp.path({ suffix: '.zip' }),
		tempDir = path.dirname(tempName);

	fs.existsSync(tempDir) || wrench.mkdirSyncRecursive(tempDir);

	this.logger.info(__('Downloading %s', url.cyan));

	var tempStream = fs.createWriteStream(tempName),
		req = request({
			url: url,
			proxy: this.config.get('cli.httpProxyServer'),
			rejectUnauthorized: this.config.get('cli.rejectUnauthorized', true)
		});

	req.pipe(tempStream);

	req.on('error', function (err) {
		fs.existsSync(tempName) && fs.unlinkSync(tempName);
		this.logger.log();
		this.logger.error(__('Failed to download template: %s', url) + '\n');
		callback(true);
	}.bind(this));

	req.on('response', function (req) {
		if (req.statusCode >= 400) {
			// something went wrong, abort
			_t.logger.error(__('Request failed with HTTP status code %s %s', req.statusCode, http.STATUS_CODES[req.statusCode] || ''));
			callback(true);
			return;
		}

		tempStream.on('close', function () {
			_t.unzipFile(tempName, function (err, dir) {
				fs.unlinkSync(tempName);
				callback(err, dir);
			});
		});
	});
};

/**
 * Unzips the specified file.
 * @param {String} zipFile - A local path to a zip file to unzip
 * @param {Function} callback - The function to call after the file has been unzipped
 */
CreateCommand.prototype.unzipFile = function unzipFile(zipFile, callback) {
	var dir = this.tempUnzipDir = temp.mkdirSync({ prefix: 'titanium-' });
	fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
	this.logger.info(__('Extracting %s', zipFile.cyan));
	appc.zip.unzip(zipFile, dir, null, function() {
		callback(null, dir);
	});
};

// create the builder instance and expose the public api
(function (createCommand) {
	exports.config   = createCommand.config.bind(createCommand);
	exports.validate = createCommand.validate.bind(createCommand);
	exports.run      = createCommand.run.bind(createCommand);
}(new CreateCommand));
