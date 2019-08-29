/**
 * @overview
 * Create project command responsible for making the project directory and
 * copying template files.
 *
 * @copyright
 * Copyright (c) 2012-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc'),
	async = require('async'),
	fields = require('fields'),
	fs = require('fs'),
	i18n = appc.i18n(__dirname),
	path = require('path'),
	ti = require('node-titanium-sdk'),
	__ = i18n.__;

exports.cliVersion = '>=3.2.1';
exports.title = __('Create');
exports.desc = __('creates a new project');
exports.extendedDesc = __('Creates a new Titanium application, native module, or Apple Watch™ app.') + '\n\n'
	+ __('Apple, iPhone, and iPad are registered trademarks of Apple Inc. Apple Watch is a trademark of Apple Inc.') + '\n\n'
	+ __('Android is a trademark of Google Inc.');

/**
 * Encapsulates the create command's state.
 * @class
 * @classdesc Implements the CLI command interface for the create command.
 * @constructor
 */
function CreateCommand() {
	this.creators = {};
}

/**
 * Defines the create command's CLI configuration.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 * @return {Function}
 */
CreateCommand.prototype.config = function config(logger, config, cli) {
	this.logger = logger;
	this.config = config;
	this.cli = cli;

	fields.setup({ colors: cli.argv.colors });

	return function (finished) {
		// find and load the creators
		const creatorDir = path.join(__dirname, '..', 'lib', 'creators'),
			jsRegExp = /\.js$/,
			typeConf = {};

		async.eachSeries(fs.readdirSync(creatorDir), function (filename, next) {
			if (!jsRegExp.test(filename)) {
				return next();
			}

			const creator = new (require(path.join(creatorDir, filename)))(logger, config, cli); // eslint-disable-line security/detect-non-literal-require
			this.creators[creator.type] = creator;

			try {
				if (typeof creator.init === 'function') {
					if (creator.init.length > 1) {
						typeConf[creator.type] = creator.init(function (conf) {
							typeConf[creator.type] = conf;
							next();
						});
						return;
					}
					typeConf[creator.type] = creator.init();
				}
			} catch (ex) {
				// squeltch
				delete this.creators[creator.type];
			} finally {
				next();
			}
		}.bind(this), function () {
			cli.createHook('create.config', this, function (callback) {
				var conf = {
					flags: {
						force: {
							abbr: 'f',
							desc: __('force project creation even if path already exists')
						}
					},
					options: appc.util.mix({
						type: {
							abbr: 't',
							default: cli.argv.prompt ? undefined : 'app',
							desc: __('the type of project to create'),
							order: 100,
							prompt: function (callback) {
								callback(fields.select({
									title: __('What type of project would you like to create?'),
									promptLabel: __('Select a type by number or name'),
									default: 'app',
									margin: '',
									numbered: true,
									relistOnError: true,
									complete: true,
									suggest: false,
									options: Object.keys(this.creators)
										.map(function (type) {
											return {
												label: this.creators[type].title || type,
												value: type,
												order: this.creators[type].titleOrder
											};
										}, this)
										.sort(function (a, b) {
											return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
										})
								}));
							}.bind(this),
							required: true,
							values: Object.keys(this.creators)
						}
					}, ti.commonOptions(logger, config)),
					type: typeConf
				};

				callback(null, conf);
			})(function (err, result) {
				finished(result);
			});
		}.bind(this));
	}.bind(this);
};

/**
 * Performs the project creation including making the project directory and copying
 * the project template files.
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 * @param {Function} finished - A callback to fire when the project has been created
 */
CreateCommand.prototype.run = function run(logger, config, cli, finished) {
	var type = cli.argv.type,
		creator = this.creators[type];

	// load the project type lib
	logger.info(__('Creating %s project', type.cyan));

	appc.async.series(this, [
		function (next) {
			cli.emit([
				'create.pre',
				'create.pre.' + type
			], creator, next);
		},

		function (next) {
			creator.run(function (err) {
				if (err) {
					logger.error(err.message || err.toString());
					next(err);
				} else {
					cli.emit([
						'create.post.' + type,
						'create.post'
					], creator, next);
				}
			});
		}
	], function (err) {
		cli.emit('create.finalize', creator, function () {
			if (err) {
				logger.error(__('Failed to create project after %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
			} else {
				logger.info(__('Project created successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
			}
			finished(err);
		});
	});
};

// create the builder instance and expose the public api
(function (createCommand) {
	exports.config   = createCommand.config.bind(createCommand);
	exports.run      = createCommand.run.bind(createCommand);
}(new CreateCommand()));
