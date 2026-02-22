/*
 * start-server.js: Titanium serve runtime server bootstrap
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

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

export async function startServer({ logger, project, server }) {
	const projectDir = project && project.dir;
	if (!projectDir) {
		throw new Error('Unable to start serve runtime without a project directory.');
	}

	const vitePath = resolveVitePath(projectDir);
	const { createServer } = await import(pathToFileURL(vitePath).href);
	const configFile = findViteConfigFile(projectDir);
	const bridge = createTiViteBridge({
		platform: project.platform,
		target: project.target,
		type: project.type
	});

	const viteServer = await createServer({
		root: projectDir,
		configFile,
		clearScreen: false,
		plugins: [
			tiBridgePlugin({
				context: bridge.context,
				reportTiApiUsage: bridge.reportTiApiUsage
			})
		],
		server: {
			host: server.host,
			port: server.port,
			hmr: {
				host: server.host,
				port: server.port,
				clientPort: server.port
			},
			strictPort: true
		}
	});

	await viteServer.listen();
	const urls = collectUrls(viteServer.resolvedUrls);
	if (logger && urls.length) {
		logger.info(`[Serve] Vite dev server running at ${urls[0]}`);
	}

	return {
		viteServer,
		bridge,
		urls
	};
}

function resolveVitePath(projectDir) {
	try {
		return require.resolve('vite', { paths: [ projectDir ] });
	} catch {
		throw new Error('Unable to resolve "vite" from the project. Install it in your app project first.');
	}
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

function createTiViteBridge({ platform, target, type }) {
	const context = {
		command: 'serve',
		platform,
		target,
		type
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

function tiBridgePlugin({ context, reportTiApiUsage }) {
	return {
		name: 'ti-vite-bridge',
		api: {
			context,
			reportTiApiUsage
		}
	};
}

function collectUrls(resolvedUrls) {
	if (!resolvedUrls) {
		return [];
	}
	return []
		.concat(resolvedUrls.local || [])
		.concat(resolvedUrls.network || [])
		.filter(Boolean);
}
