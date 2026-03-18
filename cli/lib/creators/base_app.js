/**
 * @overview
 * Base logic for creating new Titanium apps.
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
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { availablePlatformsNames, platforms, scrubPlatforms } from '../sdk-platforms.js';
import { mkdirSync } from 'node:fs';
import { TiappXML } from 'node-titanium-sdk/titanium';
import { existsSync } from 'node-titanium-sdk/util';

/**
 * Creates application projects.
 *
 * @module lib/creators/base_app
 */
export class BaseAppCreator extends Creator {
	/**
	 * Constructs the base app creator.
	 * @class
	 * @classdesc Creates an app project.
	 * @constructor
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 * @param {Object} options - Configuration options
	 * @param {string} options.title - The display title for this creator
	 * @param {number} options.titleOrder - The order for display in prompts
	 * @param {string} options.type - The project type identifier
	 */
	constructor(logger, config, cli, options = {}) {
		super(logger, config, cli);

		this.title = options.title || 'Titanium App (Classic)';
		this.titleOrder = options.titleOrder || 1;
		this.type = options.type || 'app';

		// build list of all valid platforms
		const availablePlatforms = {};
		const validPlatforms = {};

		for (const platform of platforms) {
			if (/^iphone|ios|ipad$/.test(platform)) {
				validPlatforms['iphone'] = availablePlatforms['iphone'] = 1;
				validPlatforms['ipad'] = availablePlatforms['ipad'] = 1;
				validPlatforms['ios'] = 1;
			} else {
				validPlatforms[platform] = availablePlatforms[platform] = 1;
			}
		}

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
				id:              this.configOptionId(150),
				name:            this.configOptionName(140),
				platforms:       this.configOptionPlatforms(120),
				template:        this.configOptionTemplate(110),
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

		const argv = this.cli.argv;
		const platforms = scrubPlatforms(argv.platforms);
		const projectDir = expand(argv['workspace-dir'], argv.name);

		mkdirSync(projectDir, { recursive: true });

		// download/install the project template
		this.processTemplate((err, templateDir) => {
			if (err) {
				return callback(err);
			}

			let projectConfig = null;
			const tasks = [
				function (next) {
					// copy the template files, if exists
					const dir = join(templateDir, 'template');
					if (!existsSync(dir)) {
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
					};
					const tiappFile = join(projectDir, 'tiapp.xml');

					if (platforms.original.includes('ios')) {
						if (!platforms.original.includes('ipad')) {
							platforms.original.push('ipad');
						}
						if (!platforms.original.includes('iphone')) {
							platforms.original.push('iphone');
						}
					}

					availablePlatformsNames.forEach(function (p) {
						if (p !== 'ios') {
							params['deployment-targets'][p] = platforms.original.includes(p);
						}
					});

					const tiapp = new TiappXML(existsSync(tiappFile) ? tiappFile : undefined);

					this.cli.createHook('create.populateTiappXml', this, (tiapp, params, done) => {
						// read and populate the tiapp.xml
						this.logger.info('Writing tiapp.xml');
						tiapp.merge(params).save(tiappFile);
						done();
					})(tiapp, params, next);
				},

				function (next) {
					// make sure the Resources dir exists
					const dir = join(projectDir, 'Resources');
					mkdirSync(dir, { recursive: true });
					next();
				}
			];

			platforms.scrubbed.forEach(function (platform) {
				// if we're using the built-in template, load the platform specific template hooks
				const usingBuiltinTemplate = templateDir.indexOf(this.sdk.path) === 0,
					platformTemplateDir = join(this.sdk.path, platform, 'templates', this.projectType, this.cli.argv.template);

				if (usingBuiltinTemplate) {
					this.cli.scanHooks(join(platformTemplateDir, 'hooks'));
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

						const p = join(this.sdk.path, platform, 'cli', 'commands', '_create.js');
						if (existsSync(p)) {
							this.logger.info(`Copying ${platform.cyan} platform resources`);
							const { run } = await import(p);
							await run(this.logger, this.config, this.cli, projectConfig);
							return finalize();
						}

						// does this platform have new or old style implementations?
						const templatePath = join(platformTemplateDir, 'template');
						if (!existsSync(templatePath)) {
							return finalize();
						}
						this.copyDir(templatePath, projectDir, finalize);
					}.bind(this));
				});
			}, this);

			appc.async.series(this, tasks, callback);
		});
	}
}
