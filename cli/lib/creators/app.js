/**
 * @overview
 * Logic for creating new Titanium apps.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	Creator = require('../creator'),
	fs = require('fs'),
	path = require('path'),
	ti = require('titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
	wrench = require('wrench'),
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
function AppCreator(logger, config, cli) {
	Creator.apply(this, arguments);
}

util.inherits(AppCreator, Creator);

AppCreator.type = 'app';

(function (creator) {
	// build list of all valid platforms
	var availablePlatforms = {},
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

	creator.availablePlatforms = ['all'].concat(Object.keys(availablePlatforms));
	creator.validPlatforms = validPlatforms;
}(AppCreator));

/**
 * Creates the project directory and copies the project files.
 * @param {Function} callback - A function to call after the project has been created
 */
AppCreator.prototype.run = function run(callback) {
	var tasks = [
			function (next) {
				// copy the template files, if exists
				var dir = path.join(this.templateDir, 'template');
				if (!fs.existsSync(dir)) return next();

				this.logger.info(__('Template directory: %s', this.templateDir.cyan));

				this.copyDir(dir, this.projectDir, next);
			},

			function (next) {
				// create the tiapp.xml
				var params = {
						id: this.id,
						name: this.projectName,
						url: this.url,
						version: '1.0',
						guid: uuid.v4(),
						'deployment-targets': {},
						'sdk-version': this.sdk.name
					},
					tiappFile = path.join(this.projectDir, 'tiapp.xml');

				if (this.platforms.original.indexOf('ios') != -1) {
					this.platforms.original.indexOf('ipad') != -1 || this.platforms.original.push('ipad');
					this.platforms.original.indexOf('iphone') != -1 || this.platforms.original.push('iphone');
				}

				ti.availablePlatformsNames.forEach(function (p) {
					if (p != 'ios') {
						params['deployment-targets'][p] = this.platforms.original.indexOf(p) != -1;
					}
				}, this);

				this.cli.createHook('create.populateTiappXml', this, function (tiapp, params, done) {
					// read and populate the tiapp.xml
					this.logger.info(__('Writing tiapp.xml'));
					this.projectConfig = appc.util.mix(tiapp, params);
					this.projectConfig.save(tiappFile);
					done();
				}.bind(this))(fs.existsSync(tiappFile) ? new ti.tiappxml(tiappFile) : new ti.tiappxml(), params, next);
			},

			function (next) {
				// make sure the Resources dir exists
				var dir = path.join(this.projectDir, 'Resources');
				fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
				next();
			}
		],
		isBuiltinTemplate = this.templateDir.indexOf(this.sdk.path) == 0;

	this.platforms.scrubbed.forEach(function (platform) {
		if (isBuiltinTemplate) {
			this.cli.scanHooks(path.join(this.sdk.path, platform, 'templates', this.projectType, this.template, 'hooks'));
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
				if (this.templateDir.indexOf(this.sdk.path) == 0) {
					var finalize = function () {
						this.cli.emit([
							'create.post.' + this.projectType + '.platform.' + platform,
							'create.post.platform.' + platform
						], this, next);
					}.bind(this);

					var p = path.join(this.sdk.path, platform, 'cli', 'commands', '_create.js');
					if (fs.existsSync(p)) {
						this.logger.info(__('Copying %s platform resources', platform.cyan));
						require(p).run(this.logger, this.config, this.cli, this.projectConfig);
						return finalize();
					} else {
						// does this platform have new or old style implementations?
						var templatePath = path.join(this.sdk.path, platform, 'templates', this.projectType, this.template, 'template');
						if (!fs.existsSync(templatePath)) return finalize();

						this.copyDir(templatePath, this.projectDir, finalize);
						return;
					}
				}

				finalize();
			}.bind(this));
		});
	}, this);

	tasks.push(function (next) {
		// send the analytics
		/*
		this.cli.addAnalyticsEvent('project.create.mobile', {
			dir: this.projectDir,
			name: this.projectName,
			publisher: this.projectConfig.publisher,
			url: this.projectConfig.url,
			image: this.projectConfig.image,
			appid: this.id,
			description: this.projectConfig.description,
			type: 'mobile',
			guid: this.projectConfig.guid,
			version: this.projectConfig.version,
			copyright: this.projectConfig.copyright,
			runtime: '1.0',
			date: (new Date()).toDateString()
		});
		*/
		next();
	});

	appc.async.series(this, tasks, callback);
};
