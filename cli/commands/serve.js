/*
 * serve.js: Titanium Mobile CLI serve command
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import path from 'node:path';
import fs from 'fs-extra';
import merge from 'lodash.merge';
import ti from 'node-titanium-sdk';
import tiappxml from 'node-titanium-sdk/lib/tiappxml.js';
import { pathToFileURL } from 'node:url';

import * as buildCommand from './build.js';
import { startServer } from '../lib/serve/start-server.js';
import { resolveHost } from '../lib/serve/resolve-host.js';
import { determineProjectType } from '../lib/serve/project-type.js';
import { createServeHash, readServeMetadata, writeServeMetadata } from '../lib/serve/metadata.js';

const DEFAULT_PORT = 8323;

export const cliVersion = '>=3.2.1';
export const title = 'Serve';
export const desc = 'serves an app through the Titanium Vite runtime';
export const extendedDesc = 'Starts a Vite dev server and launches a build artifact.';

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
						default: DEFAULT_PORT,
						desc: 'serve server port',
						callback: function (port) {
							const value = parseInt(port, 10);
							return Number.isNaN(value) ? DEFAULT_PORT : value;
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
	const port = cli.argv.port || DEFAULT_PORT;
	let force = cli.argv.force;

	const platform = ti.resolvePlatform(cli.argv.platform);
	const platformName = platform === 'iphone' ? 'ios' : platform;
	const metadataPath = path.join(projectDir, 'build', platform, '.serve', 'metadata.json');

	let viteServer;
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
		const serverResult = await startServer({
			logger,
			project: {
				dir: projectDir,
				type: determineProjectType(projectDir),
				platform: platformName,
				target: cli.argv.target,
				tiapp: cli.tiapp
			},
			server: {
				host,
				port
			}
		});
		viteServer = serverResult.viteServer;

		const builder = await getPlatformBuilder(cli, platform);

		if (force) {
			logger.info('[Serve] Forcing app rebuild ...');
			cli.argv['build-only'] = true;
			cli.argv.serve = true;
			try {
				await runBuildAsync(logger, config, cli);
			} finally {
				cli.argv['build-only'] = false;
			}
			try {
				await writeServeMetadata(metadataPath, metadata);
			} catch (metaErr) {
				logger.warn(`[Serve] Failed to write serve metadata: ${metaErr.message}`);
				logger.warn('[Serve] Next serve run will trigger a full rebuild.');
			}
		} else {
			logger.info('[Serve] Reusing previous build artifacts ...');
			cli.argv['build-only'] = false;
		}

		cli.argv.serve = true;
		cli.argv.force = !!force;
		if (builder && Object.prototype.hasOwnProperty.call(builder, 'buildOnly')) {
			builder.buildOnly = false;
		}

		await ensureBuilderReadyForLaunch(builder, platform, cli);
		assertLaunchArtifactsExist(builder, platform, cli);
		await launchWithPlatformLauncher({ logger, config, cli, builder, platform });
	} catch (err) {
		if (viteServer) {
			await viteServer.close().catch(() => {});
		}
		logger.error(`[Serve] Failed: ${err.message}`);
		logger.debug(err.stack);
		return finished(err);
	}

	finished();
}

function runBuildAsync(logger, config, cli) {
	return new Promise((resolve, reject) => {
		buildCommand.run(logger, config, cli, (err) => {
			if (err && err instanceof Error) {
				return reject(err);
			}
			resolve();
		});
	});
}

async function getPlatformBuilder(cli, platform) {
	const buildCommandPath = path.join(cli.sdk.path, platform, 'cli', 'commands', '_build.js');
	const buildModule = await import(pathToFileURL(buildCommandPath).href);
	if (!buildModule || !buildModule.builder) {
		throw new Error(`Serve launch is not supported for platform "${platform}" in this SDK.`);
	}
	return buildModule.builder;
}

async function ensureBuilderReadyForLaunch(builder, platform, cli) {
	if (!builder) {
		throw new Error('Unable to prepare builder state for serve launch.');
	}

	if (platform === 'android') {
		if (!builder.appid || !builder.classname || !builder.apkFile) {
			await builder.initialize();
		}
		return;
	}

	if (platform === 'iphone') {
		if (!builder.xcodeAppDir || !builder.iosBuildDir) {
			await builder.initialize();
		}
		if (cli.argv.target === 'device') {
			builder.determineLogServerPort();
		}
		return;
	}

	throw new Error(`Serve launch does not support platform "${platform}".`);
}

function assertLaunchArtifactsExist(builder, platform, cli) {
	if (platform === 'android') {
		if (!builder.apkFile || !fs.existsSync(builder.apkFile)) {
			throw new Error('No previous Android build artifact found. Re-run with --force.');
		}
		return;
	}

	if (platform === 'iphone') {
		if (cli.argv.target === 'device' || cli.argv.target === 'simulator' || cli.argv.target === 'macos') {
			if (!builder.xcodeAppDir || !fs.existsSync(builder.xcodeAppDir)) {
				throw new Error('No previous iOS build artifact found. Re-run with --force.');
			}
		}
		return;
	}

	throw new Error(`Serve launch does not support platform "${platform}".`);
}

async function launchWithPlatformLauncher({ logger, config, cli, builder, platform }) {
	if (platform === 'android') {
		const { createAndroidLauncher } = await import('../../android/cli/lib/launcher.js');
		const launcher = createAndroidLauncher({ logger, config, cli });
		await invokeLauncherStep(done => launcher.preCompile(builder, done));
		await invokeLauncherStep(done => launcher.postCompile(builder, done));
		return;
	}

	if (platform === 'iphone') {
		if (cli.argv.target === 'device') {
			const { installOnDevice } = await import('../../iphone/cli/lib/device-installer.js');
			await invokeLauncherStep(done => installOnDevice({ logger, cli, builder, finished: done }));
			return;
		}

		if (cli.argv.target === 'simulator' || cli.argv.target === 'macos') {
			const { launchOnSimulatorOrMac } = await import('../../iphone/cli/lib/simulator-launcher.js');
			await invokeLauncherStep(done => {
				launchOnSimulatorOrMac({ logger, config, cli, builder, finished: done }).catch(done);
			});
			return;
		}

		throw new Error(`Serve launch for iOS target "${cli.argv.target}" is not supported.`);
	}

	throw new Error(`Serve launch does not support platform "${platform}".`);
}

function invokeLauncherStep(step) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const done = (err) => {
			if (settled) {
				return;
			}
			settled = true;
			if (err instanceof Error) {
				return reject(err);
			}
			if (err && err !== true) {
				return reject(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
			}
			resolve();
		};

		try {
			step(done);
		} catch (err) {
			done(err);
		}
	});
}
