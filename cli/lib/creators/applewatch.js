/**
 * @overview
 * Logic for creating new Apple Watch apps.
 *
 * @copyright
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	Creator = require('../creator'),
	fields = require('fields'),
	fs = require('fs'),
	moment = require('moment'),
	path = require('path'),
	ti = require('titanium-sdk'),
	tiappxml = require('titanium-sdk/lib/tiappxml'),
	util = require('util'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

/**
 * Creates Apple Watch projects.
 *
 * @module lib/creators/applewatch
 */

module.exports = AppleWatchCreator;

/**
 * Constructs the Apple Watch creator.
 * @class
 * @classdesc Creates a module project.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function AppleWatchCreator(logger, config, cli) {
	Creator.apply(this, arguments);

	this.title = __('Apple Watch App');
	this.titleOrder = 3;
	this.type = 'applewatch';
}

util.inherits(AppleWatchCreator, Creator);

/**
 * Initializes the Apple Watch app creator.
 */
AppleWatchCreator.prototype.init = function init() {
	if (process.platform !== 'darwin') {
		throw new Error(__('Platform "%s" is not supported', process.platform));
	}

	return {
		options: {
			'name':        this.configOptionAppName(140),
			'project-dir': this.configOptionProjectDir(150),
			'template':    this.configOptionTemplate(160)
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
AppleWatchCreator.prototype.configOptionAppName = function configOptionAppName(order) {
	var cli = this.cli,
		config = this.config,
		logger = this.logger;

	function validate(value, callback) {
		if (!value) {
			logger.error(__('Please specify a Apple Watch app name') + '\n');
			return callback(true);
		}
		callback(null, value);
	}

	return {
		abbr: 'n',
		desc: __('the name of the Apple Watch app'),
		order: order,
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('Apple Watch app name'),
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Defines the --project-dir option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
AppleWatchCreator.prototype.configOptionProjectDir = function configOptionProjectDir(order) {
	var cli = this.cli,
		config = this.config,
		logger = this.logger;

	function validate(projectDir, callback) {
		var dir = appc.fs.resolvePath(projectDir),
			file = path.join(dir, 'tiapp.xml'),
			root = path.resolve('/');

		if (!fs.existsSync(dir)) {
			logger.error(__('Project directory does not exist') + '\n');
			return callback(true);
		}

		// we could be in the project's Resources directory, so we go up the tree until we find a tiapp.xml
		while (!fs.existsSync(file)) {
			dir = path.dirname(dir);
			if (dir === root) {
				if (projectDir !== '.') {
					logger.error(__('Invalid project directory "%s" because the tiapp.xml is not found', projectDir));
				}
				return callback(true);
			}
			file = path.join(dir, 'tiapp.xml');
		}

		var dest = path.join(projectDir, 'extensions', cli.argv.name);
		if (!cli.argv.force && fs.existsSync(dest)) {
			logger.error(__('Apple Watch app already exists: %s', dest));
			logger.error(__('Either change the Watch App\'s name or re-run this command with the --force flag.') + '\n');
			process.exit(1);
		}

		callback(null, dir);
	}

	return {
		abbr: 'd',
		callback: function (projectDir) {
			if (projectDir === '') {
				// no option value was specified
				// set project dir to current directory
				projectDir = conf.options['project-dir'].default;
			}

			projectDir = appc.fs.resolvePath(projectDir);

			// load the tiapp.xml
			try {
				this.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'));
			} catch (ex) {
				logger.error(ex);
				logger.log();
				process.exit(1);
			}

			this.tiapp.properties || (this.tiapp.properties = {});

			// make sure the tiapp.xml is sane
			ti.validateTiappXml(this.logger, this.config, this.tiapp);

			return projectDir;
		}.bind(this),
		desc: __('the directory containing the project'),
		default: '.',
		order: order,
		prompt: function (callback) {
			callback(fields.file({
				promptLabel: __('Where is the __project directory__?'),
				complete: true,
				showHidden: true,
				ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
				ignoreFiles: /.*/,
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Creates the project directory and copies the project files.
 *
 * @param {Function} callback - A function to call after the project has been created
 */
AppleWatchCreator.prototype.run = function run(callback) {
	Creator.prototype.run.apply(this, arguments);

	var projectDir = this.cli.argv['project-dir'],
		extName = this.cli.argv.name,
		dest = path.join(projectDir, 'extensions', extName),
		watchkitExtName = extName + 'WatchApp Extension',
		watchkitExtId = this.tiapp.id + '.watchkitextension',
		watchkitAppName = extName + 'WatchApp',
		watchkitAppId = this.tiapp.id + '.watchkitapp';

	// download/install the project template
	this.processTemplate(function (err, templateDir) {
		if (err) {
			return callback(err);
		}

		this.cli.argv.force && fs.existsSync(dest) && wrench.rmdirSyncRecursive(dest);
		fs.existsSync(dest) || wrench.mkdirSyncRecursive(dest);

		this.copyDir(path.join(templateDir, 'template'), dest, function () {
			/*
			<extensions>
				<extension projectPath="extensions/foo/foo.xcodeproj">
					<target name="WatchKit Catalog WatchKit Extension">
						<provisioning-profiles>
							<device/>
							<dist-appstore/>
							<dist-adhoc/>
						</provisioning-profiles>
					</target>

					<target name="WatchKit Catalog WatchKit App">
						<provisioning-profiles>
							<device/>
							<dist-appstore/>
							<dist-adhoc/>
						</provisioning-profiles>
					</target>
				</extension>
			</extensions>
			*/

			callback();
		}, {
			appId: this.tiapp.id,
			extName: extName,
			watchkitExtName: watchkitExtName,
			watchkitExtId: watchkitExtId,
			watchkitAppName: watchkitAppName,
			watchkitAppId: watchkitAppId,
			author: this.tiapp.publisher || '',
			date: moment().format('l'),
			copyright: this.tiapp.copyright ? (this.tiapp.copyright + (/\.$/.test(this.tiapp.copyright) ? '' : '.')) : ('Copyright © ' + (new Date).getFullYear() + '.')
		});
	}.bind(this));
};
