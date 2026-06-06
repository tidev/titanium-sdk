/**
 * @overview
 * The base class for platform specific build commands. This ensures some
 * commonality between build commands so that hooks can consistently
 * access build properties.
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import appc from 'node-appc';
import async from 'async';
import ejs from 'ejs';
import fields from 'fields';
import fs from 'fs-extra';
import http from 'node:http';
import path from 'node:path';
import request from 'request';
import temp from 'temp';
import ti from 'node-titanium-sdk';

/**
 * The base class for project creators (i.e. apps, modules).
 *
 * General usage is to extend the Creator class and override the run(), methods.
 *
 * @module lib/creator
 */
export class Creator {
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
	constructor(logger, config, cli) {
		this.logger = logger;
		this.config = config;
		this.cli = cli;

		this.availablePlatforms = [];
		this.validPlatforms = {};
	}

	/**
	 * Init stub function. Meant to be overwritten. Function must be synchronous.
	 */
	init() {
		// stub
	}

	/**
	 * Common tasks to run.
	 *
	 * @param {Function} callback - A function to call after the function finishes
	 */
	run() {
		if (this.cli.argv.type === 'alloy') {
			// alloy app - reset type to normal app
			this.cli.argv.type = 'app';
		}
		this.projectType = this.cli.argv.type;
		this.sdk = this.cli.env.getSDK(this.cli.argv.sdk);
	}

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
	copyDir(srcDir, destDir, callback, variables) {
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
					_t.logger.debug(`Copying ${src.cyan} => ${dest.cyan}`);
					// strip the .ejs extension and render the template
					fs.writeFileSync(dest, ejs.render(fs.readFileSync(src).toString(), variables));
				} else {
					_t.logger.debug(`Copying ${src.cyan} => ${dest.cyan}`);
					fs.writeFileSync(dest, fs.readFileSync(src));
				}

				fs.chmodSync(dest, fs.statSync(src).mode & 0o777);
				next();

			} else {
				// ignore
				next();
			}
		}, callback);
	}

	/**
	 * Defines the --id option.
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionId(order) {
		const cli = this.cli,
			config = this.config,
			logger = this.logger,
			idPrefix = config.get('app.idprefix');

		function validate(value, callback) {
			if (!value) {
				logger.error('Please specify an App ID\n');
				return callback(true);
			}

			// general app id validation
			if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)$/.test(value)) {
				logger.error(`Invalid App ID "${value}"`);
				logger.error('The App ID must consist of letters, numbers, dashes, and underscores.');
				logger.error('Note: Android does not allow dashes and iOS does not allow underscores.');
				logger.error('The first character must be a letter or underscore.');
				logger.error('Usually the App ID is your company\'s reversed Internet domain name. (e.g. com.example.myapp)\n');
				return callback(true);
			}

			if (cli.argv.type !== 'app' || cli.argv.platforms.indexOf('android') !== -1) {
				if (value.indexOf('-') !== -1) {
					logger.error(`Invalid App ID "${value}"`);
					logger.error(`Dashes are not allowed in the App ID when targeting ${'Android'.cyan}.\n`);
					return callback(true);
				}

				if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(value)) {
					logger.error(`Invalid App ID "${value}"`);
					logger.error(`Numbers are not allowed directly after periods when targeting ${'Android'.cyan}.\n`);
					return callback(true);
				}

				if (!ti.validAppId(value)) {
					logger.error(`Invalid App ID "${value}"`);
					logger.error(`The app must not contain Java reserved words when targeting ${'Android'.cyan}.\n`);
					return callback(true);
				}
			} else {
				// android is not in the list of platforms
				let counter = 0;

				if (value.indexOf('-') !== -1) {
					logger.warn('The specified App ID is not compatible with the Android platform.');
					logger.warn('Android does not allow dashes in the App ID.');
					counter++;
				}

				if (!/^([a-zA-Z_]{1}[a-zA-Z0-9_]*(\.[a-zA-Z_]{1}[a-zA-Z0-9_]*)*)$/.test(value)) {
					counter || logger.warn('The specified App ID is not compatible with the Android platform.');
					logger.warn('Android does not allow numbers directly following periods in the App ID.');
					counter++;
				}

				if (!ti.validAppId(value)) {
					counter || logger.warn('The specified App ID is not compatible with the Android platform.');
					logger.warn('Android does not allow Java reserved words in the App ID.');
					counter++;
				}

				counter && logger.warn('If you wish to add Android support, you will need to fix the <id> in the tiapp.xml.\n');
			}

			if (value.indexOf('_') !== -1) {
				if (cli.argv.type !== 'app' && (cli.argv.platforms.indexOf('ios') !== -1 || cli.argv.platforms.indexOf('iphone') !== -1 || cli.argv.platforms.indexOf('ipad') !== -1)) {
					logger.error(`Invalid App ID "${value}"`);
					logger.error(`Underscores are not allowed in the App ID when targeting ${'iOS'.cyan}.\n`);
					return callback(true);
				} else {
					logger.warn('The specified App ID is not compatible with the iOS platform.');
					logger.warn('iOS does not allow underscores in the App ID.');
					logger.warn('If you wish to add iOS support, you will need to fix the <id> in the tiapp.xml.\n');
				}
			}

			callback(null, value);
		}

		return {
			desc: 'the App ID in the format \'com.companyname.appname\'',
			order: order,
			prompt: function (callback) {
				let defaultValue;
				const name = cli.argv.name.replace(/[^a-zA-Z0-9]/g, '');
				if (idPrefix) {
					defaultValue = idPrefix.replace(/\.$/, '') + '.' + (/^[a-zA-Z]/.test(name) || (cli.argv.type === 'app' && cli.argv.platforms.indexOf('android') === -1) ? '' : 'my') + name;
				}

				callback(fields.text({
					default: defaultValue,
					promptLabel: 'App ID',
					validate: validate
				}));
			},
			required: true,
			validate: validate
		};
	}

	/**
	 * Defines the -c option to select the code base (Swift or Obj-C).
	 * Kept for backwards compatibility, remove in SDK 10
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionCodeBase(order) {
		const cli = this.cli;
		const validTypes = [ 'swift', 'objc' ];
		const logger = this.logger;

		function validate(value, callback) {
			if (!value || !validTypes.includes(value)) {
				logger.error('Please specify a valid code base\n');
				return callback(true);
			}
			callback(null, value);
		}

		return {
			abbr: 'c',
			desc: 'the code base of the iOS project',
			order: order,
			default: !cli.argv.prompt ? 'objc' : undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
			required: false,
			validate: validate,
			values: validTypes,
			hidden: true
		};
	}

	/**
	 * Defines the --name option.
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionName(order) {
		const cli = this.cli,
			config = this.config,
			logger = this.logger;

		function validate(value, callback) {
			if (!value) {
				logger.error('Please specify a project name\n');
				return callback(true);
			}

			if ((cli.argv.type !== 'app' || cli.argv.platforms.indexOf('android') !== -1) && value.indexOf('&') !== -1) {
				if (config.get('android.allowAppNameAmpersands', false)) {
					logger.warn('The project name contains an ampersand (&) which will most likely cause problems.');
					logger.warn('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.');
					logger.warn(`Refer to ${'https://titaniumsdk.com/guide/Titanium_SDK/Titanium_SDK_How-tos/Cross-Platform_Mobile_Development_In_Titanium/Internationalization.html'.cyan} for more information.`);
				} else {
					logger.error('The project name contains an ampersand (&) which will most likely cause problems.');
					logger.error('It is recommended that you change the app name in the tiapp.xml or define the app name using i18n strings.');
					logger.error(`Refer to ${'https://titaniumsdk.com/guide/Titanium_SDK/Titanium_SDK_How-tos/Cross-Platform_Mobile_Development_In_Titanium/Internationalization.html'} for more information.`);
					logger.error('To allow ampersands in the app name, run:');
					logger.error('    ti config android.allowAppNameAmpersands true\n');
					return callback(true);
				}
			}

			callback(null, value);
		}

		return {
			abbr: 'n',
			desc: 'the name of the project',
			order: order,
			prompt: function (callback) {
				callback(fields.text({
					promptLabel: 'Project name',
					validate: validate
				}));
			},
			required: true,
			validate: validate
		};
	}

	/**
	 * Defines the --platforms option.
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionPlatforms(order) {
		const cli = this.cli,
			logger = this.logger,
			availablePlatforms = this.availablePlatforms,
			validPlatforms = this.validPlatforms;

		function validate(value, callback) {
			// just in case they set -p or --platforms without a value
			if (value === true || value === '') {
				logger.error(`Invalid platforms value "${value}"\n`);
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
				if (badLen === 1) {
					logger.error(`Invalid platform: ${Object.keys(badValues).join(', ')}\n`);
				} else {
					logger.error(`Invalid platforms: ${Object.keys(badValues).join(', ')}\n`);
				}
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
			desc: 'one or more target platforms.',
			order: order,
			prompt: function (callback) {
				callback(fields.text({
					promptLabel: `Target platform (${availablePlatforms.join('|')})`,
					default: 'all',
					validate: validate
				}));
			},
			required: true,
			skipValueCheck: true,
			validate: validate,
			values: availablePlatforms
		};
	}

	/**
	 * Defines the --template option.
	 *
	 * @param {Integer} order - The order to apply to this option.
	 * @param {string} defaultValue the default value to use
	 *
	 * @returns {Object}
	 */
	configOptionTemplate(order, defaultValue) {
		return {
			desc: 'the name of the project template, path to template dir, path to zip file, or URL to zip file',
			default: defaultValue || 'default',
			order: order,
			required: true
		};
	}

	/**
	 * Defines the --workspace-dir option.
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionWorkspaceDir(order) {
		const cli = this.cli,
			config = this.config,
			logger = this.logger;
		let workspaceDir = config.app.workspace ? appc.fs.resolvePath(config.app.workspace) : null;

		workspaceDir && !fs.existsSync(workspaceDir) && (workspaceDir = null);

		function validate(dir, callback) {
			if (!dir) {
				logger.error('Please specify the workspace directory\n');
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
						logger.error('Directory "curr" is not writable\n');
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
					logger.error(`Project already exists: ${projectDir}`);
					logger.error('Either change the project name, workspace directory, or re-run this command with the --force flag.\n');
					process.exit(1);
				}
			}

			callback(null, dir);
		}

		return {
			abbr: 'd',
			default: !cli.argv.prompt && workspaceDir || undefined,
			desc: 'the directory to place the project in',
			order: order,
			prompt: function (callback) {
				callback(fields.file({
					complete: true,
					default: workspaceDir || '.',
					ignoreDirs: new RegExp(config.get('cli.ignoreDirs')), // eslint-disable-line security/detect-non-literal-regexp
					ignoreFiles: new RegExp(config.get('cli.ignoreFiles')), // eslint-disable-line security/detect-non-literal-regexp
					promptLabel: 'Directory to place project',
					showHidden: true,
					validate: validate
				}));
			},
			required: true,
			validate: validate
		};
	}

	/**
	 * Defines the --workspace-dir option.
	 *
	 * @param {Function} next - Callback function
	 *
	 * @returns {Object}
	 */
	processTemplate(next) {
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

		next(new Error(`Unable to find template "${template}"`));
	}

	/**
	 * Downloads the specified file and unzips it.
	 *
	 * @param {String} url - The URL of a zip file to download
	 * @param {Function} callback - The function to call after the file has been downloaded and unzipped
	 */
	downloadFile(url, callback) {
		const tempName = temp.path({ suffix: '.zip' }),
			tempDir = path.dirname(tempName);

		fs.ensureDirSync(tempDir);

		this.logger.info(`Downloading ${url.cyan}`);

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
			this.logger.error(`Failed to download template: ${url}\n`);
			callback(true);
		}.bind(this));

		req.on('response', function (req) {
			if (req.statusCode >= 400) {
				// something went wrong, abort
				this.logger.error(`Request failed with HTTP status code ${req.statusCode} ${http.STATUS_CODES[req.statusCode] || ''}`);
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
	}

	/**
	* Unzips the specified file.
	*
	* @param {String} zipFile - A local path to a zip file to unzip
	* @param {Function} callback - The function to call after the file has been unzipped
	*/
	unzipFile(zipFile, callback) {
		const dir = temp.mkdirSync({ prefix: 'titanium-' });
		fs.ensureDirSync(dir);
		this.logger.info(`Extracting ${zipFile.cyan}`);
		const logger = this.logger;

		this.cli.on('create.finalize', function () {
			// clean up the temp dir
			if (fs.existsSync(dir)) {
				logger.debug(`Removing temp unzip dir: ${dir.cyan}`);
				fs.rmdirSync(dir);
			}
		});

		appc.zip.unzip(zipFile, dir, null, function () {
			callback(null, dir);
		});
	}
}
