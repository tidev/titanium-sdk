/*
 * vite-utils.js: Shared Vite utilities for Titanium CLI
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import fs from 'fs-extra';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const VITE_CONFIG_FILENAMES = [
	'vite.config.js',
	'vite.config.mjs',
	'vite.config.cjs',
	'vite.config.ts',
	'vite.config.mts',
	'vite.config.cts'
];

export function resolveVitePath(projectDir) {
	try {
		return require.resolve('vite', { paths: [ projectDir ] });
	} catch {
		throw new Error('Unable to resolve "vite" from the project. Run "npm install" in your project directory.');
	}
}

export function findViteConfigFile(projectDir) {
	for (const filename of VITE_CONFIG_FILENAMES) {
		const file = path.join(projectDir, filename);
		if (fs.existsSync(file)) {
			return file;
		}
	}
	return undefined;
}

export function tiBridgePlugin({ context, reportTiApiUsage }) {
	return {
		name: 'ti-vite-bridge',
		api: {
			context,
			reportTiApiUsage
		}
	};
}

export function createTiViteBridge(context) {
	const result = { tiSymbols: {} };

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
