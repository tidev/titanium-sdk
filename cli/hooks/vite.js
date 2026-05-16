import fs from 'fs-extra';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
	resolveVitePath,
	findViteConfigFile,
	tiBridgePlugin,
	createTiViteBridge
} from '../lib/vite-utils.js';

export const id = 'ti.vite';

export function init(logger, config, cli) {
	let commandName;
	let isViteInstalled = false;

	cli.on('cli:command-loaded', hookData => {
		const command = hookData.command;
		commandName = typeof command.name === 'function' ? command.name() : command.name;
	});

	cli.on('cli:post-validate', () => {
		if (commandName !== 'build' && commandName !== 'serve') {
			return;
		}

		const projectDir = cli.argv['project-dir'];
		if (typeof projectDir !== 'string') {
			return;
		}

		const pkgPath = path.join(projectDir, 'package.json');
		if (!fs.existsSync(pkgPath)) {
			return;
		}

		let pkg;
		try {
			pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
		} catch (err) {
			logger.warn(`[vite] Failed to parse ${pkgPath}: ${err.message}`);
			return;
		}

		const allDeps = Object.keys(pkg.devDependencies || {})
			.concat(Object.keys(pkg.dependencies || {}));
		isViteInstalled = allDeps.includes('vite');
	});

	cli.on('build.pre.compile', {
		priority: 800,
		async post(builder) {
			if (!isViteInstalled) {
				return;
			}

			builder.useBundler = true;

			// `ti serve` already started the Vite dev server before invoking the build pipeline.
			// Only mark the builder as bundler-backed and skip one-off Vite build work here.
			if (commandName === 'serve') {
				return;
			}

			const projectDir = cli.argv['project-dir'];
			const platform = normalizePlatform(cli.argv.platform);
			const bridge = createTiViteBridge({
				platform,
				deployType: builder.deployType,
				target: cli.argv.target,
				nativeModules: collectNativeModules(builder)
			});
			const bridgePlugin = tiBridgePlugin({
				context: bridge.context,
				reportTiApiUsage: bridge.reportTiApiUsage
			});

			const vitePath = resolveVitePath(projectDir);
			const { createBuilder } = await import(pathToFileURL(vitePath).href);
			const configFile = findViteConfigFile(projectDir);

			logger.info('Building with Vite');
			const viteBuilder = await createBuilder({
				root: projectDir,
				configFile,
				plugins: [ bridgePlugin ]
			});
			await viteBuilder.buildApp();
			const result = bridge.getResult();
			if (!result) {
				logger.warn('Vite bridge did not provide Ti symbol usage.');
				return;
			}

			builder.tiSymbols = result.tiSymbols;
		}
	});
}

// `ti build -p iphone|ipad|ios` all target iOS. Normalize to a stable token
// before it leaves the CLI so downstream consumers (Vite plugins) deal with a
// single value per platform.
function normalizePlatform(raw) {
	if (typeof raw !== 'string') return undefined;
	if (/^(iphone|ipad|ios)$/i.test(raw)) return 'ios';
	if (/^android$/i.test(raw)) return 'android';
	return raw;
}

function collectNativeModules(builder) {
	const modules = builder?.tiapp?.modules;
	if (!Array.isArray(modules)) {
		return [];
	}
	return modules
		.filter(entry => entry && typeof entry.id === 'string')
		.map(entry => {
			return { ...entry, id: entry.id };
		});
}
