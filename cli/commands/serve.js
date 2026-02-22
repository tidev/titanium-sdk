/*
 * serve.js: Titanium Mobile CLI serve command
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import path from 'node:path';
import { promisify } from 'node:util';
import fs from 'fs-extra';
import merge from 'lodash.merge';
import ti from 'node-titanium-sdk';
import tiappxml from 'node-titanium-sdk/lib/tiappxml.js';

import * as buildCommand from './build.js';
import { startServer } from '../lib/serve/start-server.js';
import { resolveHost } from '../lib/serve/resolve-host.js';
import { createServeHash, readServeMetadata, writeServeMetadata } from '../lib/serve/metadata.js';

export const cliVersion = '>=3.2.1';
export const title = 'Serve';
export const desc = 'serves an app through the Titanium Vite runtime';
export const extendedDesc = 'Starts a Vite dev server, builds the app, and launches it.';

export function config(logger, config, cli) {
	const platform = cli.argv._[1];
	const createBuildConfig = buildCommand.config(logger, config, cli);

	return function (done) {
		createBuildConfig(function (buildConfig) {
			const platformOption = buildConfig.options.platform;
			if (platform && platformOption.values.includes(platform)) {
				// Convert positional platform shortcut (`ti serve android`) to `-p android`.
				cli.argv._.splice(1, 1);
				cli.argv.$_ || (cli.argv.$_ = []);
				cli.argv.$_.push('-p', platform);
			}

			const mergedConfig = merge(buildConfig, {
				options: {
					host: {
						desc: 'serve host ip'
					},
					port: {
						default: 8323,
						desc: 'serve server port',
						callback: function (port) {
							if (port === undefined || port === null || port === '') {
								return 8323;
							}
							const value = parseInt(port, 10);
							return Number.isNaN(value) ? 8323 : value;
						}
					},
					'project-dir': {
						callback: function (projectDir) {
							if (projectDir === '') {
								projectDir = buildConfig.options['project-dir'].default;
							}

							projectDir = path.resolve(projectDir);

							if (fs.existsSync(path.join(projectDir, 'tiapp.xml'))) {
								let tiapp;
								try {
									tiapp = cli.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'));
								} catch (ex) {
									logger.error(ex);
									process.exit(1);
								}

								tiapp.properties || (tiapp.properties = {});
								ti.validateTiappXml(logger, config, tiapp);

								// Keep SDK mismatch handling within this command and do not fall back to `build`.
								if (!ti.validateCorrectSDK(logger, config, cli, 'serve')) {
									throw new cli.GracefulShutdown();
								}

								cli.argv.type = 'app';
							} else {
								// serve currently targets app projects only.
								return;
							}

							cli.scanHooks(path.join(projectDir, 'hooks'));

							return projectDir;
						}
					}
				}
			});

			// `serve` owns the build/install/run cycle and does not support these build-only flags.
			delete mergedConfig.flags['build-only'];
			delete mergedConfig.flags.legacy;

			done(mergedConfig);
		});
	};
}

export function validate(logger, config, cli) {
	return buildCommand.validate(logger, config, cli);
}

export async function run(logger, config, cli, finished) {
	const projectDir = cli.argv['project-dir'];
	const host = cli.argv.host || resolveHost();
	const port = cli.argv.port || 8323;
	let force = cli.argv.force;

	const legacyPlatformName = cli.argv.platform === 'android' ? 'android' : 'iphone';
	const platform = cli.argv.platform.replace(/^(iphone|ipad)$/i, 'ios');
	const metadataPath = path.join(projectDir, 'build', legacyPlatformName, '.serve', 'metadata.json');

	try {
		const buildHash = createServeHash({
			tiapp: cli.tiapp && typeof cli.tiapp.toString === 'function' ? cli.tiapp.toString() : cli.tiapp,
			target: cli.argv.target,
			server: {
				host,
				port
			},
			env: {
				DEBUG: process.env.DEBUG
			}
		});
		const metadata = { hash: buildHash };

		if (!force) {
			const previousMetadata = readServeMetadata(metadataPath);
			if (!previousMetadata || previousMetadata.hash !== buildHash) {
				force = true;
			}
		}

		logger.info('[Serve] Starting Vite dev server ...');
		await startServer({
			logger,
			project: {
				dir: projectDir,
				platform,
				target: cli.argv.target,
				tiapp: cli.tiapp
			},
			server: {
				host,
				port
			}
		});
		if (force) {
			logger.info('[Serve] Forcing app rebuild ...');
		} else {
			logger.info('[Serve] Running incremental build ...');
		}

		cli.argv.serve = true;
		cli.argv.force = !!force;

		const runBuild = promisify(buildCommand.run);
		await runBuild(logger, config, cli);
		await writeServeMetadata(metadataPath, metadata);
	} catch (err) {
		return finished(err);
	}

	finished();
}
