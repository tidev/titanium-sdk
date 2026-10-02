import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import semver from 'semver';
import util from 'node:util';
import 'colors';
import { appcd } from '../lib/webpack/appcd.js';
import { WebpackService } from '../lib/webpack/service.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const MIN_APPCD_VERSION = '3.2.0';

const createWebpackLogger = (logger) => {
	const webpackLogger = {
		formatWithBadge(args) {
			return `${' WEBPACK '.bgCyan.black} ${util.format(...args)}`;
		}
	};
	[ 'info', 'debug', 'warn', 'error' ].forEach(level => {
		webpackLogger[level] = (...args) => logger[level](webpackLogger.formatWithBadge(args));
	});
	return webpackLogger;
};

export const id = 'ti.webpack';

export function init(logger, config, cli) {
	let commandName;
	let isWebpackEnabled = false;
	let projectType;
	let client;
	let appcdRootPath;

	cli.on('cli:command-loaded', (hookData) => {
		const command = hookData.command;
		commandName = command.name;
		if (typeof command.name === 'function') {
			commandName = command.name();
		}
	});

	cli.on('cli:post-validate', async () => {
		projectType = await getWebpackProjectType(cli.argv['project-dir']);
		if (projectType === null) {
			return;
		}
		isWebpackEnabled = true;
		process.env.TI_USE_WEBPACK = true;

		if (commandName !== 'build') {
			return;
		}

		// plain ti-cli, load daemon from global modules
		const globalModulesPath = execSync('npm root -g').toString().replace(/\s+$/, '');
		appcdRootPath = resolveModuleRoot('appcd', [ globalModulesPath ]);
		if (!fs.existsSync(appcdRootPath)) {
			throw new Error('Unable to find global Appcelerator Daemon install. You can install it with "npm i appcd -g".');
		}

		ensureAppcdVersion(appcdRootPath, MIN_APPCD_VERSION);
		const AppcdClient = await resolveAppcdClient(appcdRootPath);
		const baseClient = new AppcdClient();
		client = appcd(baseClient);
	});

	cli.on('build.pre.compile', {
		priority: 800,
		async post(builder) {
			if (!isWebpackEnabled) {
				return;
			}

			builder.useWebpack = true;

			const badgedLogger = createWebpackLogger(logger);
			const webpackService = new WebpackService({
				client,
				logger: badgedLogger,
				cli,
				builder,
				projectType
			});

			try {
				await webpackService.build();
			} catch (e) {
				if (e.status === 404) {
					badgedLogger.info('Daemon was unable to find the Webpack plugin. To continue you need to:');
					badgedLogger.info('');

					const appcdVersion = await getAppcdVersion(appcdRootPath);
					const appcdCommand = 'appcd';
					const pluginName = '@appcd/plugin-webpack';

					if (semver.gte(appcdVersion, '4.0.0')) {
						badgedLogger.info(`- Install it with ${appcdCommand} pm install ${pluginName}`);
					} else {
						badgedLogger.info(`- Install it with npm i -g ${pluginName}`);
						badgedLogger.info(`- Restart the daemon with ${appcdCommand} restart`);
					}

					badgedLogger.info('');
				}

				if (cli.argv.platform === 'ios') {
					// The iOS build shows the error message only, log the stack manually
					// to make sure it get printed as well
					logger.error(e.stack);
				}

				throw e;
			}
		}
	});
}

async function getWebpackProjectType(projectDir) {
	if (typeof projectDir !== 'string') {
		return null;
	}
	const pkgPath = path.join(projectDir, 'package.json');
	if (!fs.existsSync(pkgPath)) {
		return null;
	}

	const tiPlugins = [
		'@titanium-sdk/webpack-plugin-classic',
		'@titanium-sdk/webpack-plugin-alloy',
		'@titanium-sdk/webpack-plugin-vue',
		'@titanium-sdk/webpack-plugin-angular'
	];
	// eslint-disable-next-line security/detect-non-literal-require
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	const allDeps = Object.keys(pkg.devDependencies || {})
		.concat(Object.keys(pkg.dependencies || {}));
	const pluginId = tiPlugins.find(id => allDeps.includes(id));
	if (!pluginId) {
		return null;
	}
	return pluginId.substring(pluginId.lastIndexOf('-') + 1);
}

function resolveModuleRoot(name, paths) {
	try {
		let resolvedPath;
		if (paths) {
			resolvedPath = require.resolve(name, { paths });
		} else {
			resolvedPath = require.resolve(name);
		}
		return resolvedPath.substr(0, resolvedPath.indexOf(`${path.sep}appcd${path.sep}`) + 7);
	} catch (e) {
		return null;
	}
}

function ensureAppcdVersion(appcdRootPath, version) {
	const appcdVersion = getAppcdVersion(appcdRootPath);
	if (!semver.gte(appcdVersion, version)) {
		throw new Error(`The Webpack build system requires Appcelerator Daemon v${MIN_APPCD_VERSION}+ (installed: ${appcdVersion}). Please update your global daemon install with "npm i appcd -g"'.`);
	}
}

async function getAppcdVersion(appcdRootPath) {
	return fs.readJson(path.join(appcdRootPath, 'package.json')).version;
}

async function resolveAppcdClient(appcdPackagePath) {
	const appcdClientPath = require.resolve('appcd-client', {
		paths: [
			path.join(appcdPackagePath, 'node_modules')
		]
	});
	// eslint-disable-next-line security/detect-non-literal-require
	return (await import(appcdClientPath)).default;
}
