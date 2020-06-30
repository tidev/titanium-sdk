/**
 * @overview
 * Logic for creating new Titanium modules.
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
	Creator = require('../creator'),
	fs = require('fs-extra'),
	path = require('path'),
	ti = require('node-titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
	fields = require('fields'),
	__ = appc.i18n(__dirname).__;

/**
 * Creates module projects.
 *
 * @module lib/creators/module
 */

module.exports = ModuleCreator;

/**
 * Constructs the module creator.
 * @class
 * @classdesc Creates a module project.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function ModuleCreator(logger, config, cli) { // eslint-disable-line no-unused-vars
	Creator.apply(this, arguments);

	this.title = __('Titanium Module');
	this.titleOrder = 2;
	this.type = 'module';

	// build list of all valid platforms
	const availablePlatforms = {},
		validPlatforms = {};

	ti.platforms.forEach(function (platform) {
		if (/^iphone|ios|ipad$/.test(platform)) {
			validPlatforms['iphone'] = 1;
			validPlatforms['ipad'] = 1;
			validPlatforms['ios'] = availablePlatforms['ios'] = 1;
		} else {
			validPlatforms[platform] = availablePlatforms[platform] = 1;
		}
	});

	// add "all"
	validPlatforms['all'] = 1;

	this.availablePlatforms = [ 'all' ].concat(Object.keys(availablePlatforms));
	this.validPlatforms = validPlatforms;
}

util.inherits(ModuleCreator, Creator);

/**
 * Initializes the module creator.
 * @return {object}
 */
ModuleCreator.prototype.init = function init() {
	return {
		options: {
			id:              this.configOptionId(150),
			name:            this.configOptionName(140),
			platforms:       this.configOptionPlatforms(120),
			template:        this.configOptionTemplate(110),
			'workspace-dir': this.configOptionWorkspaceDir(170),
			'code-base':	 this.configOptionCodeBase(150),
			'android-code-base': this.configOptionAndroidCodeBase(150),
			'ios-code-base': this.configOptionIosCodeBase(140)

		}
	};
};

/**
 * Defines the --android-code-base option to select the code base (Java or Kotlin).
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
ModuleCreator.prototype.configOptionAndroidCodeBase = function configAndroidCodeBase(order) {
	const cli = this.cli;
	const validTypes = [ 'java', 'kotlin' ];
	const logger = this.logger;

	function validate(value, callback) {
		if (!value || !validTypes.includes(value)) {
			logger.error(__('Please specify a valid code base') + '\n');
			return callback(true);
		}
		callback(null, value);
	}

	return {
		desc: __('the code base of the Android project'),
		order: order,
		default: !cli.argv.prompt ? 'java' : undefined,
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('Android code base (' + validTypes.join('|') + ')'),
				default: 'java',
				validate: validate
			}));
		},
		required: true,
		validate: validate,
		values: validTypes,
		verifyIfRequired: function (callback) {
			if (cli.argv.platforms.includes('android')) {
				return callback(true);
			}
			return callback();
		}
	};
};

/**
 * Defines the --ios-code-base option to select the code base (Objective-C or Swift).
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
ModuleCreator.prototype.configOptionIosCodeBase = function configIosCodeBase(order) {
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
 * Creates the project directory and copies the project files.
 * @param {Function} callback - A function to call after the project has been created
 */
ModuleCreator.prototype.run = function run(callback) {
	Creator.prototype.run.apply(this, arguments);

	const platforms = ti.scrubPlatforms(this.cli.argv.platforms),
		projectName = this.cli.argv.name,
		projectDir = this.projectDir = appc.fs.resolvePath(this.cli.argv['workspace-dir'], projectName),
		id = this.cli.argv.id;

	fs.ensureDirSync(projectDir);

	// download/install the project template
	this.processTemplate(function (err, templateDir) {
		if (err) {
			return callback(err);
		}

		const variables = {
				author: this.config.get('user.name', 'Your Name'),
				publisher: this.config.get('app.publisher', 'Your Company'),
				guid: uuid.v4(),
				tisdkVersion: this.sdk.name,
				tisdkPath: this.sdk.path,
				year: (new Date()).getFullYear(),

				// My Module
				moduleName: projectName,

				// MyModule
				moduleNameCamel: projectName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').split(/[\W_]/).map(function (s) { return appc.string.capitalize(s); }).join(''),

				// mymodule
				moduleNameJSSafe: projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_'),

				// com.appcelerator.mymodule
				moduleId: id,

				// ComAppceleratorMymodule
				moduleIdAsIdentifier: id.replace(/[\s-]/g, '_').replace(/_+/g, '_').split(/\./).map(function (s) { return s.substring(0, 1).toUpperCase() + s.substring(1); }).join(''),

				// com/appcelerator/mymodule
				moduleIdAsFolder: id.replace(/\./g, path.sep),

				mainEncryptedAsset: '',
				allEncryptedAssets: '',
				mainEncryptedAssetReturn: 'return nil;',
				allEncryptedAssetsReturn: 'return nil;'
			},
			tasks = [
				function (next) {
					// copy the template files, if exists
					const dir = path.join(templateDir, 'template');
					if (!fs.existsSync(dir)) {
						next();
					} else {
						this.logger.info(__('Template directory: %s', templateDir.cyan));
						this.copyDir(dir, projectDir, next, variables);
					}
				}
			];

		platforms.scrubbed.forEach(function (platform) {
			// if we're using the built-in template, load the platform specific template hooks
			const usingBuiltinTemplate = templateDir.indexOf(this.sdk.path) === 0;
			let templateBaseDir = this.cli.argv.template;

			if (platform === 'iphone' && (this.cli.argv['code-base'] || this.cli.argv['ios-code-base'])) {
				templateBaseDir = this.cli.argv['ios-code-base'] || this.cli.argv['code-base'];
			} else if (platform === 'android' && this.cli.argv['android-code-base']) {
				templateBaseDir = this.cli.argv['android-code-base'];
			}

			const defaultTemplateDir = path.join(this.sdk.path, platform, 'templates', this.projectType, 'default');
			const platformTemplateDir = path.join(this.sdk.path, platform, 'templates', this.projectType, templateBaseDir);

			if (usingBuiltinTemplate) {
				this.cli.scanHooks(path.join(platformTemplateDir, 'hooks'));
			}

			tasks.push(function (next) {
				this.cli.emit([
					'create.pre.platform.' + platform,
					'create.pre.' + this.projectType + '.platform.' + platform
				], this, function (err) {
					if (err) {
						return next(err);
					}

					// only copy platform specific files if we're copying from a built-in template
					if (usingBuiltinTemplate) {
						this.cli.createHook('create.copyFiles.platform.' + platform, this, function (vars, done) {
							this.logger.info(__('Copying %s platform resources', platform.cyan));
							appc.async.series(this, [
								(cb) => {
									this.copyDir(path.join(defaultTemplateDir, 'template'), projectDir, cb, vars);
								},
								(cb) => {
									this.copyDir(path.join(platformTemplateDir, 'template'), projectDir, cb, vars);
								},
							], () => {
								this.cli.emit([
									'create.post.' + this.projectType + '.platform.' + platform,
									'create.post.platform.' + platform
								], this, done);
							});
						}.bind(this))(appc.util.mix({ platform: platform }, variables), next);
						return;
					}

					this.cli.emit([
						'create.post.' + this.projectType + '.platform.' + platform,
						'create.post.platform.' + platform
					], this, next);
				}.bind(this));
			});
		}, this);

		tasks.push(function (next) {
			// send the analytics
			this.cli.addAnalyticsEvent('project.create.module', {
				name: variables.moduleName,
				author: variables.author,
				moduleid: variables.moduleId,
				description: '',
				guid: variables.guid,
				version: '1.0.0',
				copyright: 'copyright: Copyright (c) ' + variables.year + ' by ' + variables.publisher,
				minsdk: this.sdk.name,
				platforms: platforms.original.join(', '),
				date: (new Date()).toDateString()
			});
			next();
		});

		appc.async.series(this, tasks, callback);
	}.bind(this));
};
