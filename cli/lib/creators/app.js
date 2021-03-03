/**
 * @overview
 * Logic for creating new Titanium apps.
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
	__ = appc.i18n(__dirname).__;

/**
 * Creates application projects.
 *
 * @module lib/creators/app
 */

module.exports = AppCreator;

/**
 * Constructs the app creator.
 * @class
 * @classdesc Creates an app project.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function AppCreator(logger, config, cli) { // eslint-disable-line no-unused-vars
	Creator.apply(this, arguments);

	this.title = __('Titanium App');
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

util.inherits(AppCreator, Creator);

/**
 * Initializes the app creator.
 * @return {object}
 */
AppCreator.prototype.init = function init() {
	return {
		options: {
			id:            this.configOptionId(150),
			name:          this.configOptionName(140),
			platforms:     this.configOptionPlatforms(120),
			template:      this.configOptionTemplate(110),
			url:           this.configOptionUrl(160),
			'workspace-dir': this.configOptionWorkspaceDir(170)
		}
	};
};

/**
 * Creates the project directory and copies the project files.
 * @param {Function} callback - A function to call after the project has been created
 */
AppCreator.prototype.run = function run(callback) {
	Creator.prototype.run.apply(this, arguments);

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
					this.logger.info(__('Template directory: %s', templateDir.cyan));
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
						guid: uuid.v4(),
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
					this.logger.info(__('Writing tiapp.xml'));
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
				], this, function (err) {
					if (err) {
						return next(err);
					}

					const finalize = function () {
						this.cli.emit([
							'create.post.' + this.projectType + '.platform.' + platform,
							'create.post.platform.' + platform
						], this, next);
					}.bind(this);

					// legacy... only copy platform specific files if we're copying from a built-in template
					if (!usingBuiltinTemplate) {
						return finalize();
					}

					const p = path.join(this.sdk.path, platform, 'cli', 'commands', '_create.js');
					if (fs.existsSync(p)) {
						this.logger.info(__('Copying %s platform resources', platform.cyan));
						require(p).run(this.logger, this.config, this.cli, projectConfig); // eslint-disable-line security/detect-non-literal-require
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

		tasks.push(function (next) {
			// send the analytics
			this.cli.addAnalyticsEvent('project.create.mobile', {
				name:        argv.name,
				publisher:   projectConfig.publisher,
				url:         projectConfig.url,
				image:       projectConfig.image,
				appid:       argv.id,
				description: '',
				type:        'mobile',
				guid:        projectConfig.guid,
				version:     projectConfig.version,
				copyright:   projectConfig.copyright,
				runtime:     '1.0.0',
				date:        (new Date()).toDateString()
			});
			next();
		});

		appc.async.series(this, tasks, callback);
	}.bind(this));
};
