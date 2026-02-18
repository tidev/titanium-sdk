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
import fields from 'fields';
import fs from 'node:fs';
import path from 'node:path';
import ti from 'node-titanium-sdk';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
	async config(logger, config, cli) {
		this.logger = logger;
		this.config = config;
		this.cli = cli;

		fields.setup({ colors: cli.argv.colors });

		// find and load the creators
		const creatorDir = path.join(__dirname, '..', 'lib', 'creators');
		const jsRegExp = /\.js$/;
		const typeConf = {};

		for (const filename of fs.readdirSync(creatorDir)) {
			if (!jsRegExp.test(filename) || filename === 'base_app.js') {
				continue;
			}

			const { default: CreatorConstructor } = await import(pathToFileURL(path.join(creatorDir, filename)));
			const creator = new CreatorConstructor(logger, config, cli);
			this.creators[creator.type] = creator;

			try {
				if (typeof creator.init === 'function') {
					if (creator.init.length > 1) {
						await new Promise(resolve => {
							typeConf[creator.type] = creator.init(conf => {
								typeConf[creator.type] = conf;
								resolve();
							});
						});
					} else {
						typeConf[creator.type] = await creator.init();
					}
				}
			} catch (ex) {
				// squeltch
				delete this.creators[creator.type];
			}
		}

		return new Promise(resolve => cli.createHook('create.config', this, (callback) => {
			const conf = {
				flags: {
					force: {
						abbr: 'f',
						desc: 'force project creation even if path already exists'
					}
				},
				options: Object.assign({
					type: {
						abbr: 't',
						default: cli.argv.prompt ? undefined : '1',
						desc: 'the type of project to create',
						order: 100,
						prompt: (callback) => {
							callback(fields.select({
								title: 'What type of project would you like to create?',
								promptLabel: 'Select a type by number or name',
								default: '1',
								margin: '',
								numbered: true,
								relistOnError: true,
								complete: true,
								suggest: false,
								options: Object.keys(this.creators)
									.map((type) => {
										return {
											label: this.creators[type].title || type,
											value: type,
											order: this.creators[type].titleOrder
										};
									}, this)
									.sort((a, b) => {
										return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
									})
							}));
						},
						required: true,
						values: Object.keys(this.creators)
					}
				}, ti.commonOptions(logger, config)),
				type: typeConf
			};

			callback(null, conf);
		})((err, result) => resolve(result)));
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

		let useAlloy = false;
		if (creator.type === 'alloy') {
			useAlloy = true;
			creator.type = 'app';
		}

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
				if (cli.argv.alloy !== undefined || useAlloy) {
					try {
						execSync(`alloy new "${path.join(cli.argv['workspace-dir'], cli.argv.name)}"`, { stdio: 'ignore' });
					} catch (_alloyError) {
						logger.error('Alloy is not installed. Run "npm i -g alloy" to install it, then run "alloy new" inside the project folder.');
					}
				}

				finished(err);
			});
		});
	}
}

// create the builder instance and expose the public API
const createCommand = new CreateCommand();
export const config = createCommand.config.bind(createCommand);
export const run = createCommand.run.bind(createCommand);
