/**
 * @overview
 * Create project command responsible for making the project directory and
 * copying template files.
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import appc from 'node-appc';
import async from 'async';
import fields from 'fields';
import fs from 'node:fs';
import path from 'node:path';
import ti from 'node-titanium-sdk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const cliVersion = '>=3.2.1';
export const title = 'Create';
export const desc = 'creates a new project';
export const extendedDesc = `Creates a new Titanium application, native module, or Apple Watch™ app.

Apple, iPhone, and iPad are registered trademarks of Apple Inc. Apple Watch is a trademark of Apple Inc.

Android is a trademark of Google Inc.`;

/**
 * Encapsulates the create command's state.
 * @class
 * @classdesc Implements the CLI command interface for the create command.
 * @constructor
 */
export class CreateCommand {
	constructor() {
		this.creators = {};
	}

	/**
	 * Defines the create command's CLI configuration.
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 * @return {Function}
	 */
	config(logger, config, cli) {
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

				import(path.join(creatorDir, filename))
					.then(({ default: CreatorConstructor }) => {
						const creator = new CreatorConstructor(logger, config, cli);
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
					})
					.catch(err => next(err));
			}.bind(this), function () {
				cli.createHook('create.config', this, function (callback) {
					var conf = {
						flags: {
							force: {
								abbr: 'f',
								desc: 'force project creation even if path already exists'
							}
						},
						options: appc.util.mix({
							type: {
								abbr: 't',
								default: cli.argv.prompt ? undefined : 'app',
								desc: 'the type of project to create',
								order: 100,
								prompt: function (callback) {
									callback(fields.select({
										title: 'What type of project would you like to create?',
										promptLabel: 'Select a type by number or name',
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
	}

	/**
	 * Performs the project creation including making the project directory and copying
	 * the project template files.
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 * @param {Function} finished - A callback to fire when the project has been created
	 */
	run(logger, config, cli, finished) {
		var type = cli.argv.type,
			creator = this.creators[type];

		// load the project type lib
		logger.info(`Creating ${type.cyan} project`);

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
					logger.error(`Failed to create project after ${appc.time.prettyDiff(cli.startTime, Date.now())}\n`);
				} else {
					logger.info(`Project created successfully in ${appc.time.prettyDiff(cli.startTime, Date.now())}\n`);
				}

				if (cli.argv.alloy !== undefined) {
					execSync(`alloy new "${path.join(cli.argv['workspace-dir'], cli.argv.name)}"`, { stdio: 'inherit' });
				}

				finished(err);
			});
		});
	}
}

// create the builder instance and expose the public api
const createCommand = new CreateCommand();
export const config = createCommand.config.bind(createCommand);
export const run = createCommand.run.bind(createCommand);
