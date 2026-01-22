import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

export function loadPackageJson(dir) {
	const { root } = path.parse(dir);
	while (dir !== root) {
		const file = path.join(dir, 'package.json');
		if (existsSync(file)) {
			return JSON.parse(readFileSync(file, 'utf8'));
		}
		dir = path.dirname(dir);
	}
	return null;
}

export function loadManifestJson(dir) {
	const { root } = path.parse(dir);
	while (dir !== root) {
		const file = path.join(dir, 'manifest.json');
		if (existsSync(file)) {
			return JSON.parse(readFileSync(file, 'utf8'));
		}
		dir = path.dirname(dir);
	}
	return null;
}
