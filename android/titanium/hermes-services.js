/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Hermes AAR from Maven Central has no JSI headers and no "libjsi.so".
// The SDK builds "libjsi.so" from the JSI sources of the same Hermes version.
const JSI_DIR_PATH = path.join(__dirname, '..', 'runtime', 'hermes', 'src', 'jsi', 'jsi');

function sha256(buffer) {
	return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Loads the "hermes" block of the "android/package.json" file.
 * @returns {Promise<{version: string, jsi: Object<string, string>}>} the Hermes version and the JSI file hashes
 */
async function loadHermesInfo() {
	const packageJson = await fs.readJson(path.join(__dirname, '..', 'package.json'));
	return packageJson.hermes;
}

/**
 * Makes sure that the JSI sources of the pinned Hermes version are in "android/runtime/hermes/src/jsi".
 * Downloads each file that is missing or that does not match its hash in "android/package.json".
 */
async function updateJsi() {
	const hermes = await loadHermesInfo();
	const baseUrl = `https://raw.githubusercontent.com/facebook/hermes/hermes-v${hermes.version}/API/jsi/jsi`;
	await fs.ensureDir(JSI_DIR_PATH);

	for (const [ fileName, expectedHash ] of Object.entries(hermes.jsi)) {
		const filePath = path.join(JSI_DIR_PATH, fileName);
		if (await fs.pathExists(filePath) && sha256(await fs.readFile(filePath)) === expectedHash) {
			continue;
		}

		const url = `${baseUrl}/${fileName}`;
		console.log(`Downloading JSI source file: ${url}`);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download "${url}". HTTP status: ${response.status}`);
		}
		const content = Buffer.from(await response.arrayBuffer());
		const actualHash = sha256(content);
		if (actualHash !== expectedHash) {
			throw new Error(`The file "${url}" has the SHA-256 hash ${actualHash}, but "android/package.json" expects ${expectedHash}.`);
		}
		await fs.writeFile(filePath, content);
	}
}

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
	const command = process.argv[2];
	if (command !== 'update-jsi') {
		console.error('Usage: node hermes-services.js update-jsi');
		process.exit(1);
	}
	updateJsi().catch(err => {
		console.error(err);
		process.exit(1);
	});
}

export { updateJsi };
