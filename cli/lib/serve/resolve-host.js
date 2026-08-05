/*
 * resolve-host.js: host resolver for Titanium serve
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import os from 'node:os';

export function resolveHost() {
	const interfaces = os.networkInterfaces();

	for (const entries of Object.values(interfaces)) {
		if (!Array.isArray(entries)) {
			continue;
		}
		for (const entry of entries) {
			if (entry && entry.family === 'IPv4' && !entry.internal) {
				return entry.address;
			}
		}
	}

	return '127.0.0.1';
}
