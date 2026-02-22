/*
 * metadata.js: Titanium serve metadata helpers
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import crypto from 'node:crypto';
import fs from 'fs-extra';

export function createServeHash(input) {
	const payload = stableStringify(input);
	return crypto.createHash('sha1').update(payload).digest('hex');
}

export function readServeMetadata(metadataPath) {
	try {
		return fs.readJsonSync(metadataPath);
	} catch {
		return null;
	}
}

export async function writeServeMetadata(metadataPath, metadata) {
	await fs.outputJson(metadataPath, metadata, { spaces: 2 });
}

function stableStringify(value) {
	return JSON.stringify(normalize(value));
}

function normalize(value) {
	if (value === null || value === undefined) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(normalize);
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === 'object') {
		const normalized = {};
		Object.keys(value).sort().forEach(key => {
			const currentValue = value[key];
			if (typeof currentValue !== 'function') {
				normalized[key] = normalize(currentValue);
			}
		});
		return normalized;
	}

	return value;
}
