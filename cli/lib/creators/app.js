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
	this.platforms = ti.scrubPlatforms(cli.argv.platforms);
}

util.inherits(AppCreator, Creator);

AppCreator.type = 'app';

(function () {
	// build list of all valid platforms
	var availablePlatforms = {},
		validPlatforms = {};

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

	AppCreator.availablePlatforms = ['all'].concat(Object.keys(availablePlatforms));
	AppCreator.validPlatforms = validPlatforms;
}());

/**
 * Creates the project directory and copies the project files.
 * @param {Function} callback - A function to call after the project has been created
 */
AppCreator.prototype.run = function run(callback) {
	var tasks = [
		function (next) {
			// copy the template files, if exists
			var dir = path.join(this.templateDir, 'template');
			if (fs.existsSync(dir)) {
				this.logger.info(__('Template directory: %s', this.templateDir.cyan));
				this.cli.createHook('create.copyFiles', this, function (templateDir, projectDir, opts, done) {
					appc.fs.copyDirSyncRecursive(templateDir, projectDir, opts);
					done();
				})(dir, this.projectDir, { logger: this.logger.debug }, next);
			} else {
				next();
			}
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
	];

	this.platforms.scrubbed.forEach(function (platform) {
		tasks.push(function (next) {
			this.cli.emit('create.pre.platform.' + platform, this, function (err) {
				if (err) {
					return next(err);
				}

				// does this platform have new or old style implementations?
				var p = appc.fs.resolvePath(__dirname, '..', '..', '..', platform, 'cli', 'lib', 'create_app.js');
				if (fs.existsSync(p)) {
					// new style!
					this.logger.info(__('Copying %s platform resources', platform.cyan));
					require(p).run(this.logger, this.config, this.cli, this.projectConfig, function () {
						this.cli.emit('create.post.platform.' + platform, this, next);
					}.bind(this));
					return;
				}

				// old style which is needed for BlackBerry and other non-updated platforms
				p = appc.fs.resolvePath(__dirname, '..', '..', '..', platform, 'cli', 'commands', '_create.js');
				if (fs.existsSync(p)) {
					this.logger.info(__('Copying %s platform resources', platform.cyan));
					require(p).run(this.logger, this.config, this.cli, this.projectConfig);
				}

				this.cli.emit('create.post.platform.' + platform, this, next);
			}.bind(this));
		});
	});

	tasks.push(function (next) {
		// send the analytics
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
		next();
	});

	appc.async.series(this, tasks, callback);
};
