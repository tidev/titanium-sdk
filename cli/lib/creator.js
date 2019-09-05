/**
 * @overview
 * The base class for platform specific build commands. This ensures some
 * commonality between build commands so that hooks can consistently
 * access build properties.
 *
 * @copyright
 * Copyright (c) 2014-2018 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc'),
	async = require('async'),
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs-extra'),
	http = require('http'),
	i18n = appc.i18n(__dirname),
	path = require('path'),
	request = require('request'),
	temp = require('temp'),
	ti = require('node-titanium-sdk'),
	__ = i18n.__,
	__n = i18n.__n;

/**
 * The base class for project creators (i.e. apps, modules).
 *
 * General usage is to extend the Creator class and override the run(), methods.
 *
 * @module lib/creator
 */

module.exports = Creator;

/**
 * Constructs the creator state. This needs to be explicitly called from the
 * derived creator's constructor.
 * @class
 * @classdesc Base class for all project creators.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function Creator(logger, config, cli) {
	this.logger = logger;
	this.config = config;
	this.cli = cli;

	this.availablePlatforms = [];
	this.validPlatforms = {};
}

/**
 * Init stub function. Meant to be overwritten. Function must be synchronous.
 */
Creator.prototype.init = function init() {
	// stub
};

/**
 * Common tasks to run.
 *
 * @param {Function} callback - A function to call after the function finishes
 */
Creator.prototype.run = function run() {
	this.projectType = this.cli.argv.type;
	this.sdk = this.cli.env.getSDK(this.cli.argv.sdk);
};

/**
 * Recursively copies files and directories to the destintion. When an .ejs file
 * is encountered, the contents is substituted and the .ejs extension is removed.
 *
 * @param {String} srcDir - The directory to copy
 * @param {String} destDir - The directory to copy the files to
 * @param {Function} callback - A function to call after all of the files have been copied
 * @param {Object} variables - An object to resolve filename substitutions and .ejs templates
 * @return {undefined}
 */
Creator.prototype.copyDir = function copyDir(srcDir, destDir, callback, variables) {
	if (!fs.existsSync(srcDir)) {
		return callback();
	}

	variables || (variables = {});

	fs.ensureDirSync(destDir);

	const _t = this,
		ejsRegExp = /\.ejs$/,
		nameRegExp = /\{\{(\w+?)\}\}/g,
		ignoreDirs = new RegExp(this.config.get('cli.ignoreDirs')), // eslint-disable-line security/detect-non-literal-regexp
		ignoreFiles = new RegExp(this.config.get('cli.ignoreFiles')); // eslint-disable-line security/detect-non-literal-regexp

	async.eachSeries(fs.readdirSync(srcDir), function (filename, next) {
		const src = path.join(srcDir, filename);

		if (!fs.existsSync(src)) {
			return next();
		}

		const destName = filename.replace(nameRegExp, function (match, name) {
			return variables[name] || variables[name.substring(0, 1).toLowerCase() + name.substring(1)] || match;
		});
		let dest = path.join(destDir, destName);

		if (fs.statSync(src).isDirectory() && !ignoreDirs.test(filename)) {
			_t.copyDir(src, dest, next, variables);

		} else if (!ignoreFiles.test(filename)) {
			if (ejsRegExp.test(filename)) {
				dest = dest.replace(ejsRegExp, '');
				_t.logger.debug(__('Copying %s => %s', src.cyan, dest.cyan));
				// strip the .ejs extension and render the template
				fs.writeFileSync(dest, ejs.render(fs.readFileSync(src).toString(), variables));
			} else {
				_t.logger.debug(__('Copying %s => %s', src.cyan, dest.cyan));
				fs.writeFileSync(dest, fs.readFileSync(src));
			}

			fs.chmodSync(dest, fs.statSync(src).mode & 0o777);
			next();

		} else {
			// ignore
			next();
		}
	}, callback);
};

/**
 * Defines the --id option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionId = function configOptionId(order) {
	const cli = this.cli,
		config = this.config,
		logger = this.logger,
		idPrefix = config.get('app.idprefix');

	function validate(value, callback) {
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
			logger.error(__('Usually the App ID is your company\'s reversed Internet domain name. (i.e. com.example.myapp)') + '\n');
			return callback(true);
		}

		if (cli.argv.type !== 'app' || cli.argv.platforms.indexOf('android') !== -1) {
			if (value.indexOf('-') !== -1) {
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
			let counter = 0;

			if (value.indexOf('-') !== -1) {
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

		if (value.indexOf('_') !== -1) {
			if (cli.argv.type !== 'app' && (cli.argv.platforms.indexOf('ios') !== -1 || cli.argv.platforms.indexOf('iphone') !== -1 || cli.argv.platforms.indexOf('ipad') !== -1)) {
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

	return {
		desc: __('the App ID in the format \'com.companyname.appname\''),
		order: order,
		prompt: function (callback) {
			let defaultValue;
			const name = cli.argv.name.replace(/[^a-zA-Z0-9]/g, '');
			if (idPrefix) {
				defaultValue = idPrefix.replace(/\.$/, '') + '.' + (/^[a-zA-Z]/.test(name) || (cli.argv.type === 'app' && cli.argv.platforms.indexOf('android') === -1) ? '' : 'my') + name;
			}

			callback(fields.text({
				default: defaultValue,
				promptLabel: __('App ID'),
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Defines the -c option to selec the code base (Swift or Obj-C).
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionCodeBase = function configCodeBase(order) {
	const cli = this.cli;
	const validTypes = [ 'swift', 'objc' ];
	const logger = this.logger;

	function validate(value, callback) {
		if (!value || !validTypes.includes(value)) {
			logger.error(__('Please specify a valid code base') + '\n');
			return callback(true);
		}
		callback(null, value);
	}

	return {
		abbr: 'c',
		desc: __('the code base of the iOS project'),
		order: order,
		default: !cli.argv.prompt ? 'objc' : undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('iOS code base (' + validTypes.join('|') + ')'),
				default: 'objc',
				validate: validate
			}));
		},
		required: true,
		validate: validate,
		values: validTypes,
		verifyIfRequired: function (callback) {
			if (cli.argv.platforms.includes('ios') || cli.argv.platforms.includes('iphone') || cli.argv.platforms.includes('ipad')) {
				return callback(true);
			}
			return callback();
		}
	};
};

/**
 * Defines the --name option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionName = function configOptionName(order) {
	const cli = this.cli,
		config = this.config,
		logger = this.logger;

	function validate(value, callback) {
		if (!value) {
			logger.error(__('Please specify a project name') + '\n');
			return callback(true);
		}

		if ((cli.argv.type !== 'app' || cli.argv.platforms.indexOf('android') !== -1) && value.indexOf('&') !== -1) {
			if (config.get('android.allowAppNameAmpersands', false)) {
				logger.warn(__('The project name contains an ampersand (&) which will most likely cause problems.'));
				logger.warn(__('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.'));
				logger.warn(__('Refer to %s for more information.', 'http://appcelerator.com/i18n-app-name'.cyan));
			} else {
				logger.error(__('The project name contains an ampersand (&) which will most likely cause problems.'));
				logger.error(__('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.'));
				logger.error(__('Refer to %s for more information.', 'http://appcelerator.com/i18n-app-name'));
				logger.error(__('To allow ampersands in the app name, run:'));
				logger.error('    %sti config android.allowAppNameAmpersands true\n', process.env.APPC_ENV ? 'appc ' : '');
				return callback(true);
			}
		}

		callback(null, value);
	}

	return {
		abbr: 'n',
		desc: __('the name of the project'),
		order: order,
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('Project name'),
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Defines the --platforms option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionPlatforms = function configOptionPlatforms(order) {
	const cli = this.cli,
		logger = this.logger,
		availablePlatforms = this.availablePlatforms,
		validPlatforms = this.validPlatforms;

	function validate(value, callback) {
		// just in case they set -p or --platforms without a value
		if (value === true || value === '') {
			logger.error(__('Invalid platforms value "%s"', value) + '\n');
			return callback(true);
		}

		let goodValues = {};
		const badValues = {};
		value.trim().toLowerCase().split(',').forEach(function (s) {
			if (s = s.trim()) {
				if (validPlatforms[s]) {
					goodValues[s] = 1;
				} else {
					badValues[s] = 1;
				}
			}
		}, this);

		const badLen = Object.keys(badValues).length;
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
				if (p !== 'all') {
					goodValues[p] = 1;
				}
			});
		}

		callback(null, Object.keys(goodValues).join(','));
	}

	return {
		abbr: 'p',
		default: !cli.argv.prompt ? 'all' : undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
		desc: __('one or more target platforms.'),
		order: order,
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('Target platform (%s)', availablePlatforms.join('|')),
				default: 'all',
				validate: validate
			}));
		},
		required: true,
		skipValueCheck: true,
		validate: validate,
		values: availablePlatforms
	};
};

/**
 * Defines the --template option.
 *
 * @param {Integer} order - The order to apply to this option.
 * @param {string} defaultValue the default value to use
 *
 * @returns {Object}
 */
Creator.prototype.configOptionTemplate = function configOptionTemplate(order, defaultValue) {
	return {
		desc: __('the name of the project template, path to template dir, path to zip file, or url to zip file'),
		default: defaultValue || 'default',
		order: order,
		required: true
	};
};

/**
 * Defines the --url option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionUrl = function configOptionUrl(order) {
	const cli = this.cli,
		config = this.config,
		logger = this.logger;

	return {
		abbr: 'u',
		default: !cli.argv.prompt && config.get('app.url') || undefined,
		desc: __('your company/personal URL'),
		order: order,
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

			Array.isArray(value) ? callback(null, value[value.length - 1]) : callback(null, value);
		}
	};
};

/**
 * Defines the --workspace-dir option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
Creator.prototype.configOptionWorkspaceDir = function configOptionWorkspaceDir(order) {
	const cli = this.cli,
		config = this.config,
		logger = this.logger;
	let workspaceDir = config.app.workspace ? appc.fs.resolvePath(config.app.workspace) : null;

	workspaceDir && !fs.existsSync(workspaceDir) && (workspaceDir = null);

	function validate(dir, callback) {
		if (!dir) {
			logger.error(__('Please specify the workspace directory') + '\n');
			return callback(true);
		}

		dir = appc.fs.resolvePath(dir);

		// check if the directory is writable
		let prev = null,
			curr = dir;
		while (curr != prev) { // eslint-disable-line eqeqeq
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

		// check if the project already exists
		if (cli.argv.name && !cli.argv.force && dir) {
			const projectDir = path.join(dir, cli.argv.name);
			if (fs.existsSync(projectDir)) {
				logger.error(__('Project already exists: %s', projectDir));
				logger.error(__('Either change the project name, workspace directory, or re-run this command with the --force flag.') + '\n');
				process.exit(1);
			}
		}

		callback(null, dir);
	}

	return {
		abbr: 'd',
		default: !cli.argv.prompt && workspaceDir || undefined,
		desc: __('the directory to place the project in'),
		order: order,
		prompt: function (callback) {
			callback(fields.file({
				complete: true,
				default: workspaceDir || '.',
				ignoreDirs: new RegExp(config.get('cli.ignoreDirs')), // eslint-disable-line security/detect-non-literal-regexp
				ignoreFiles: new RegExp(config.get('cli.ignoreFiles')), // eslint-disable-line security/detect-non-literal-regexp
				promptLabel: __('Directory to place project'),
				showHidden: true,
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Defines the --workspace-dir option.
 *
 * @param {Function} next - Callback function
 *
 * @returns {Object}
 */
Creator.prototype.processTemplate = function processTemplate(next) {
	// try to resolve the template dir
	const template = this.cli.argv.template = this.cli.argv.template || 'default';
	const additionalPaths = this.config.get('paths.templates');
	const builtinTemplateDir = appc.fs.resolvePath(this.sdk.path, 'templates', this.cli.argv.type, template);
	const searchPaths = [];

	// first check if the specified template is a built-in template name
	if (fs.existsSync(builtinTemplateDir)) {
		this.cli.scanHooks(path.join(builtinTemplateDir, 'hooks'));
		return next(null, builtinTemplateDir);
	}

	if (/^https?:\/\/.+/.test(template)) {
		return this.downloadFile(template, next);
	}

	if (/\.zip$/.test(template) && fs.existsSync(template)) {
		return this.unzipFile(template, next);
	}

	// could be the name of a template in one of the template paths
	this.cli.env.os.sdkPaths.forEach(function (dir) {
		if (fs.existsSync(dir = appc.fs.resolvePath(dir, 'templates')) && searchPaths.indexOf(dir) === -1) {
			searchPaths.push(dir);
		}
	});

	(Array.isArray(additionalPaths) ? additionalPaths : [ additionalPaths ]).forEach(function (p) {
		if (p && fs.existsSync(p = appc.fs.resolvePath(p)) && searchPaths.indexOf(p) === -1) {
			searchPaths.push(p);
		}
	});

	let dir;
	while (dir = searchPaths.shift()) {
		if (fs.existsSync(dir = path.join(dir, template))) {
			return next(null, dir);
		}
	}

	// last possibility is it's a local directory
	if (fs.existsSync(template) && fs.statSync(template).isDirectory()) {
		return next(template);
	}

	next(new Error(__('Unable to find template "%s"', template)));
};

/**
 * Downloads the specified file and unzips it.
 *
 * @param {String} url - The URL of a zip file to download
 * @param {Function} callback - The function to call after the file has been downloaded and unzipped
 */
Creator.prototype.downloadFile = function downloadFile(url, callback) {
	const tempName = temp.path({ suffix: '.zip' }),
		tempDir = path.dirname(tempName);

	fs.ensureDirSync(tempDir);

	this.logger.info(__('Downloading %s', url.cyan));

	const tempStream = fs.createWriteStream(tempName),
		req = request({
			url: url,
			proxy: this.config.get('cli.httpProxyServer'),
			rejectUnauthorized: this.config.get('cli.rejectUnauthorized', true)
		});

	req.pipe(tempStream);

	req.on('error', function () {
		fs.existsSync(tempName) && fs.unlinkSync(tempName);
		this.logger.log();
		this.logger.error(__('Failed to download template: %s', url) + '\n');
		callback(true);
	}.bind(this));

	req.on('response', function (req) {
		if (req.statusCode >= 400) {
			// something went wrong, abort
			this.logger.error(__('Request failed with HTTP status code %s %s', req.statusCode, http.STATUS_CODES[req.statusCode] || ''));
			callback(true);
			return;
		}

		tempStream.on('close', function () {
			this.unzipFile(tempName, function (err, dir) {
				fs.unlinkSync(tempName);
				callback(err, dir);
			});
		}.bind(this));
	}.bind(this));
};

/**
 * Unzips the specified file.
 *
 * @param {String} zipFile - A local path to a zip file to unzip
 * @param {Function} callback - The function to call after the file has been unzipped
 */
Creator.prototype.unzipFile = function unzipFile(zipFile, callback) {
	const dir = temp.mkdirSync({ prefix: 'titanium-' });
	fs.ensureDirSync(dir);
	this.logger.info(__('Extracting %s', zipFile.cyan));
	const logger = this.logger;

	this.cli.on('create.finalize', function () {
		// clean up the temp dir
		if (fs.existsSync(dir)) {
			logger.debug(__('Removing temp unzip dir: %s', dir.cyan));
			fs.rmdirSync(dir);
		}
	});

	appc.zip.unzip(zipFile, dir, null, function () {
		callback(null, dir);
	});
};
