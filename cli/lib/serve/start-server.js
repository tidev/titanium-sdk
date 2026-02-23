/*
 * start-server.js: Titanium serve runtime server bootstrap
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import { pathToFileURL } from 'node:url';

import {
	resolveVitePath,
	findViteConfigFile,
	tiBridgePlugin,
	createTiViteBridge
} from '../vite-utils.js';

export async function startServer({ logger, project, server }) {
	const projectDir = project && project.dir;
	if (!projectDir) {
		throw new Error('Unable to start serve runtime without a project directory.');
	}

	const vitePath = resolveVitePath(projectDir);
	const { createServer } = await import(pathToFileURL(vitePath).href);
	const configFile = findViteConfigFile(projectDir);
	const bridge = createTiViteBridge({
		command: 'serve',
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

	try {
		await viteServer.listen();
	} catch (err) {
		if (err.message && err.message.includes('already in use')) {
			throw new Error(`Port ${server.port} is already in use. Use --port to specify a different port.`);
		}
		throw err;
	}

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

function collectUrls(resolvedUrls) {
	if (!resolvedUrls) {
		return [];
	}
	return []
		.concat(resolvedUrls.local || [])
		.concat(resolvedUrls.network || [])
		.filter(Boolean);
}
