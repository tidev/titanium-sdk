import fs from 'fs-extra';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const VITE_CONFIG_FILENAMES = [
	'vite.config.js',
	'vite.config.mjs',
	'vite.config.cjs',
	'vite.config.ts',
	'vite.config.mts',
	'vite.config.cts'
];

export const id = 'ti.vite';

export function init(logger, config, cli) {
	let commandName;
	let isViteInstalled = false;

	cli.on('cli:command-loaded', hookData => {
		const command = hookData.command;
		commandName = command.name;
		if (typeof command.name === 'function') {
			commandName = command.name();
		}
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

		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
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

			const bridge = createTiViteBridge({
				platform: builder.platform,
				deployType: builder.deployType,
				target: cli.argv.target
			});
			const bridgePlugin = tiBridgePlugin({
				context: bridge.context,
				reportTiApiUsage: bridge.reportTiApiUsage
			});

			const projectDir = cli.argv['project-dir'];
			const vitePath = require.resolve('vite', { paths: [ projectDir ] });
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

function tiBridgePlugin({ context, reportTiApiUsage }) {
	return {
		name: 'ti-vite-bridge',
		// Expose explicit bridge API for Titanium-aware plugins.
		api: {
			context,
			reportTiApiUsage
		}
	};
}

function createTiViteBridge({ platform, deployType, target }) {
	const context = {
		platform,
		deployType,
		target
	};
	const result = { tiSymbols: [] };

	const reportTiApiUsage = (tiSymbols) => {
		result.tiSymbols = tiSymbols;
	};

	return {
		context,
		reportTiApiUsage,
		getResult() {
			return result;
		}
	};
}

function findViteConfigFile(projectDir) {
	for (const filename of VITE_CONFIG_FILENAMES) {
		const file = path.join(projectDir, filename);
		if (fs.existsSync(file)) {
			return file;
		}
	}
	return undefined;
}
