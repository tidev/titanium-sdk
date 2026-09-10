import { basename, dirname, join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const sdkPath = resolve(__dirname, '..', '..');
export const sdkName = basename(sdkPath);

/**
 * Loads the SDK's `manifest.json`. This file is generated when the SDK is
 * packaged, so when running from a source checkout (i.e. tests) we derive an
 * equivalent from `package.json` instead of blowing up on import.
 *
 * @returns {Object} The SDK manifest
 */
function loadSdkManifest() {
	const manifestPath = join(sdkPath, 'manifest.json');
	if (existsSync(manifestPath)) {
		return JSON.parse(readFileSync(manifestPath, 'utf8'));
	}

	const { version, moduleApiVersion } = JSON.parse(readFileSync(join(sdkPath, 'package.json'), 'utf8'));
	return {
		name: version,
		version,
		moduleAPIVersion: moduleApiVersion,
		platforms: [ 'android', 'iphone' ].filter(p => existsSync(join(sdkPath, p)))
	};
}

export const sdkManifest = loadSdkManifest();
