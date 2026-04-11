/**
 * @overview
 * Logic for creating new Titanium modules.
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import appc from 'node-appc';
import { Creator } from '../creator.js';
import fs from 'fs-extra';
import path from 'node:path';
import ti from 'node-titanium-sdk';
import { randomUUID } from 'node:crypto';
import fields from 'fields';

/**
 * Creates module projects.
 *
 * @module lib/creators/module
 */
export class ModuleCreator extends Creator {
	/**
	 * Constructs the module creator.
	 * @class
	 * @classdesc Creates a module project.
	 * @constructor
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 */
	constructor(logger, config, cli) {
		super(logger, config, cli);

		this.title = 'Titanium Module';
		this.titleOrder = 3;
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

	/**
	 * Initializes the module creator.
	 * @return {object}
	 */
	init() {
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
	}

	/**
	 * Defines the --android-code-base option to select the code base (Java or Kotlin).
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionAndroidCodeBase(order) {
		const cli = this.cli;
		const validTypes = [ 'java', 'kotlin' ];
		const logger = this.logger;

		function validate(value, callback) {
			if (!value || !validTypes.includes(value)) {
				logger.error('Please specify a valid code base\n');
				return callback(true);
			}
			callback(null, value);
		}

		return {
			desc: 'the code base of the Android project',
			order: order,
			default: !cli.argv.prompt ? 'java' : undefined,
			prompt(callback) {
				callback(fields.text({
					promptLabel: `Android code base (${validTypes.join('|')})`,
					default: 'java',
					validate: validate
				}));
			},
			required: true,
			validate: validate,
			values: validTypes,
			verifyIfRequired(callback) {
				if (cli.argv.platforms.includes('android')) {
					return callback(true);
				}
				return callback();
			}
		};
	}

	/**
	 * Defines the --ios-code-base option to select the code base (Objective-C or Swift).
	 *
	 * @param {Integer} order - The order to apply to this option.
	 *
	 * @returns {Object}
	 */
	configOptionIosCodeBase(order) {
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
			desc: 'the code base of the iOS project',
			order: order,
			default: !cli.argv.prompt ? 'objc' : undefined, // if we're prompting, then force the platforms to be prompted for, otherwise force 'all'
			prompt(callback) {
				callback(fields.text({
					promptLabel: `iOS code base (${validTypes.join('|')})`,
					default: 'objc',
					validate: validate
				}));
			},
			required: true,
			validate: validate,
			values: validTypes,
			verifyIfRequired(callback) {
				if (cli.argv.platforms.includes('ios') || cli.argv.platforms.includes('iphone') || cli.argv.platforms.includes('ipad')) {
					return callback(true);
				}
				return callback();
			}
		};
	}

	/**
	 * Creates the project directory and copies the project files.
	 * @param {Function} callback - A function to call after the project has been created
	 */
	run(callback) {
		super.run();

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
					guid: randomUUID(),
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
							this.logger.info(`Template directory: ${templateDir.cyan}`);
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
								this.logger.info(`Copying ${platform.cyan} platform resources`);
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

			appc.async.series(this, tasks, callback);
		}.bind(this));
	}
}

export default ModuleCreator;
