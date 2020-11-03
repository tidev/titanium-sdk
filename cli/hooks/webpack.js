// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const util = require('util');
require('colors');

const appcd = require('../lib/webpack/appcd');
const WebpackService = require('../lib/webpack/service');

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

exports.id = 'ti.webpack';
exports.init = (logger, config, cli) => {
	const isAppcCli = typeof process.env.APPC_ENV !== 'undefined';
	let commandName;
	let isWebpackEnabled = false;
	let projectType;
	let client;

	cli.on('cli:command-loaded', (hookData) => {
		const command = hookData.command;
		commandName = command.name;
	});

	cli.on('cli:post-validate', () => {
		projectType = getWebpackProjectType(cli.argv['project-dir']);
		if (projectType === null) {
			return;
		}
		isWebpackEnabled = true;
		process.env.TI_USE_WEBPACK = true;

		if (commandName !== 'build') {
			return;
		}

		let appcdRootPath;
		if (isAppcCli) {
			// we were invoked by appc-cli, load bundled daemon client.
			appcdRootPath = resolveModuleRoot('appcd');
			if (!fs.existsSync(appcdRootPath)) {
				throw new Error('Unable to find Appcelerator Daemon inside the appc-cli. Please make sure to use a recent appc-cli version. You can install/select it with  "appc use latest".');
			}
		} else {
			// plain ti-cli, load daemon from global modules
			const globalModulesPath = execSync('npm root -g').toString().replace(/\s+$/, '');
			appcdRootPath = resolveModuleRoot('appcd', [ globalModulesPath ]);
			if (!fs.existsSync(appcdRootPath)) {
				throw new Error('Unable to find global Appcelerator Daemon install. You can install it with "npm i appcd -g".');
			}
		}
		ensureAppcdVersion(appcdRootPath, MIN_APPCD_VERSION, isAppcCli);
		const AppcdClient = resolveAppcdClient(appcdRootPath);
		const baseClient = new AppcdClient();
		if (isAppcCli) {
			baseClient.appcd = path.resolve(appcdRootPath, '..', '.bin', 'appcd');
			if (process.platform === 'win32') {
				baseClient.appcd += '.cmd';
			}
		}
		client = appcd(baseClient);
	});

	cli.on('build.pre.compile', {
		priority: 800,
		post(builder, callback) {
			if (!isWebpackEnabled) {
				return callback();
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
			Promise.resolve().then(async () => {
				await webpackService.build();
				return callback();
			}).catch(e => {
				if (e.status === 404) {
					badgedLogger.info('Daemon was unable to find the Webpack plugin. To continue you need to:');
					badgedLogger.info('');
					const installCommand = 'npm i -g @appcd/plugin-webpack';
					badgedLogger.info(`- Install it with ${installCommand.cyan}`);
					const restartCommand = `${isAppcCli ? 'appc ' : ''}appcd restart`;
					badgedLogger.info(`- Restart the daemon with ${restartCommand.cyan}`);
					badgedLogger.info('');
				}

				if (cli.argv.platform === 'ios') {
					// The iOS build shows the error message only, log the stack manually
					// to make sure it get printed as well
					logger.error(e.stack);
				}

				callback(e);
			});
		}
	});
};

function getWebpackProjectType(projectDir) {
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
	const pkg = require(pkgPath);
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

function ensureAppcdVersion(appcdRootPath, version, isAppcCli = false) {
	// eslint-disable-next-line security/detect-non-literal-require
	const pkg = require(path.join(appcdRootPath, 'package.json'));
	if (!semver.gte(pkg.version, version)) {
		throw new Error(`The Webpack build system requires Appcelerator Daemon v${MIN_APPCD_VERSION}+ (installed: ${pkg.version}). Please update your ${isAppcCli ? 'appc-cli with "appc use latest"' : 'global daemon install with "npm i appcd -g"'}.`);
	}
}

function resolveAppcdClient(appcdPackagePath) {
	const appcdClientPath = require.resolve('appcd-client', {
		paths: [
			path.join(appcdPackagePath, 'node_modules')
		]
	});
	// eslint-disable-next-line security/detect-non-literal-require
	return require(appcdClientPath).default;
}
