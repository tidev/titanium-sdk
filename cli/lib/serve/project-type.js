/*
 * project-type.js: Titanium serve project type detection
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import fs from 'fs-extra';
import path from 'node:path';

export function determineProjectType(projectDir) {
	const pkgPath = path.join(projectDir, 'package.json');
	if (fs.existsSync(pkgPath)) {
		const pkg = fs.readJsonSync(pkgPath);
		const dependencies = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}));
		const hasWebpackPlugin = dependencies.some(dep => dep.startsWith('@titanium-sdk/webpack-plugin'));
		if (hasWebpackPlugin) {
			return 'webpack';
		}
	}

	if (fs.existsSync(path.join(projectDir, 'app'))) {
		return 'alloy';
	}

	return 'classic';
}
