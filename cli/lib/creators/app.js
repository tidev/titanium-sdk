/**
 * @overview
 * Logic for creating new Titanium apps.
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

/**
 * Creates application projects.
 *
 * @module lib/creators/app
 */
export class AppCreator extends Creator {
	/**
	 * Constructs the app creator.
	 * @class
	 * @classdesc Creates an app project.
	 * @constructor
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 */
	constructor(logger, config, cli) { // eslint-disable-line no-unused-vars
		super(logger, config, cli);

		this.title = 'Titanium App';
		this.titleOrder = 1;
		this.type = 'app';

		// build list of all valid platforms
		const availablePlatforms = {},
			validPlatforms = {};

		ti.platforms.forEach(function (platform) {
			if (/^iphone|ios|ipad$/.test(platform)) {
				validPlatforms['iphone'] = availablePlatforms['iphone'] = 1;
				validPlatforms['ipad'] = availablePlatforms['ipad'] = 1;
				validPlatforms['ios'] = 1;
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
	 * Initializes the app creator.
	 * @return {object}
	 */
	init() {
		return {
			options: {
				id:            this.configOptionId(150),
				name:          this.configOptionName(140),
				platforms:     this.configOptionPlatforms(120),
				template:      this.configOptionTemplate(110),
				'workspace-dir': this.configOptionWorkspaceDir(170)
			}
		};
	}

	/**
	 * Creates the project directory and copies the project files.
	 * @param {Function} callback - A function to call after the project has been created
	 */
	run(callback) {
		super.run();

		const argv = this.cli.argv,
			platforms = ti.scrubPlatforms(argv.platforms),
			projectDir = appc.fs.resolvePath(argv['workspace-dir'], argv.name);

		fs.ensureDirSync(projectDir);

		// download/install the project template
		this.processTemplate(function (err, templateDir) {
			if (err) {
				return callback(err);
			}

			let projectConfig = null;
			const tasks = [
				function (next) {
					// copy the template files, if exists
					const dir = path.join(templateDir, 'template');
					if (!fs.existsSync(dir)) {
						next();
					} else {
						this.logger.info(`Template directory: ${templateDir.cyan}`);
						this.copyDir(dir, projectDir, next);
					}
				},

				function (next) {
					// create the tiapp.xml
					const params = {
							id: argv.id,
							name: argv.name,
							url: argv.url || '',
							version: '1.0',
							guid: randomUUID(),
							'deployment-targets': {},
							'sdk-version': this.sdk.name
						},
						tiappFile = path.join(projectDir, 'tiapp.xml');

					if (platforms.original.indexOf('ios') !== -1) {
						platforms.original.indexOf('ipad') !== -1 || platforms.original.push('ipad');
						platforms.original.indexOf('iphone') !== -1 || platforms.original.push('iphone');
					}

					ti.availablePlatformsNames.forEach(function (p) {
						if (p !== 'ios') {
							params['deployment-targets'][p] = platforms.original.indexOf(p) !== -1;
						}
					});

					this.cli.createHook('create.populateTiappXml', this, function (tiapp, params, done) {
						// read and populate the tiapp.xml
						this.logger.info('Writing tiapp.xml');
						projectConfig = appc.util.mix(tiapp, params);
						projectConfig.save(tiappFile);
						done();
					}.bind(this))(fs.existsSync(tiappFile) ? new ti.tiappxml(tiappFile) : new ti.tiappxml(), params, next);
				},

				function (next) {
					// make sure the Resources dir exists
					const dir = path.join(projectDir, 'Resources');
					fs.ensureDirSync(dir);
					next();
				}
			];

			platforms.scrubbed.forEach(function (platform) {
				// if we're using the built-in template, load the platform specific template hooks
				const usingBuiltinTemplate = templateDir.indexOf(this.sdk.path) === 0,
					platformTemplateDir = path.join(this.sdk.path, platform, 'templates', this.projectType, this.cli.argv.template);

				if (usingBuiltinTemplate) {
					this.cli.scanHooks(path.join(platformTemplateDir, 'hooks'));
				}

				tasks.push(function (next) {
					this.cli.emit([
						'create.pre.platform.' + platform,
						'create.pre.' + this.projectType + '.platform.' + platform
					], this, async function (err) {
						if (err) {
							return next(err);
						}

						const finalize = () => {
							this.cli.emit([
								'create.post.' + this.projectType + '.platform.' + platform,
								'create.post.platform.' + platform
							], this, next);
						};

						// legacy... only copy platform specific files if we're copying from a built-in template
						if (!usingBuiltinTemplate) {
							return finalize();
						}

						const p = path.join(this.sdk.path, platform, 'cli', 'commands', '_create.js');
						if (fs.existsSync(p)) {
							this.logger.info(`Copying ${platform.cyan} platform resources`);
							const { run } = await import(p);
							await run(this.logger, this.config, this.cli, projectConfig);
							return finalize();
						}

						// does this platform have new or old style implementations?
						const templatePath = path.join(platformTemplateDir, 'template');
						if (!fs.existsSync(templatePath)) {
							return finalize();
						}
						this.copyDir(templatePath, projectDir, finalize);
					}.bind(this));
				});
			}, this);

			appc.async.series(this, tasks, callback);
		}.bind(this));
	}
}

export default AppCreator;
