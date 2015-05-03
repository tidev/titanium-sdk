/**
 * @overview
 * Logic for creating new Titanium modules.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	Creator = require('../creator'),
	fs = require('fs'),
	path = require('path'),
	ti = require('titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
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
function ModuleCreator(logger, config, cli) {
	Creator.apply(this, arguments);
}

util.inherits(ModuleCreator, Creator);

ModuleCreator.type = 'module';

(function (creator) {
	// build list of all valid platforms
	var availablePlatforms = {},
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

	creator.availablePlatforms = ['all'].concat(Object.keys(availablePlatforms));
	creator.validPlatforms = validPlatforms;
}(ModuleCreator));

/**
 * Creates the project directory and copies the project files.
 * @param {Function} callback - A function to call after the project has been created
 */
ModuleCreator.prototype.run = function run(callback) {
	var variables = {
			author: this.config.get('user.name', 'Your Name'),
			publisher: this.config.get('app.publisher', 'Your Company'),
			guid: uuid.v4(),
			tisdkVersion: this.sdk.name,
			tisdkPath: this.sdk.path,
			year: (new Date).getFullYear(),

			// My Module
			moduleName: this.projectName,

			// MyModule
			moduleNameCamel: this.projectName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').split(/[\W_]/).map(function (s) { return appc.string.capitalize(s); }).join(''),

			// mymodule
			moduleNameJSSafe: this.projectName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_'),

			// com.appcelerator.mymodule
			moduleId: this.id,

			// ComAppceleratorMymodule
			moduleIdAsIdentifier: this.id.replace(/[\s-]/g, '_').replace(/_+/g, '_').split(/\./).map(function (s) { return s.substring(0, 1).toUpperCase() + s.substring(1); }).join(''),

			// com/appcelerator/mymodule
			moduleIdAsFolder: this.id.replace(/\./g, path.sep),

			mainEncryptedAsset: '',
			allEncryptedAssets: '',
			mainEncryptedAssetReturn: 'return nil;',
			allEncryptedAssetsReturn: 'return nil;'
		},
		tasks = [
			function (next) {
				// copy the template files, if exists
				var dir = path.join(this.templateDir, 'template');
				if (!fs.existsSync(dir)) return next();

				this.logger.info(__('Template directory: %s', this.templateDir.cyan));

				this.copyDir(dir, this.projectDir, next, variables);
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
				if (isBuiltinTemplate) {
					this.cli.createHook('create.copyFiles.platform.' + platform, this, function (vars, done) {
						this.logger.info(__('Copying %s platform resources', platform.cyan));
						this.copyDir(path.join(this.sdk.path, platform, 'templates', this.projectType, this.template, 'template'), this.projectDir, function () {
							this.cli.emit([
								'create.post.' + this.projectType + '.platform.' + platform,
								'create.post.platform.' + platform
							], this, done);
						}.bind(this), vars);
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
			dir: this.projectDir,
			name: variables.moduleName,
			author: variables.author,
			moduleid: variables.moduleId,
			description: '',
			guid: variables.guid,
			version: '1.0.0',
			copyright: 'copyright: Copyright (c) ' + variables.year + ' by ' + variables.publisher,
			minsdk: this.sdk.name,
			platforms: this.platforms.original.join(', '),
			date: (new Date()).toDateString()
		});
		next();
	});

	appc.async.series(this, tasks, callback);
}
