/**
 * Cleans up the Hyperloop plugin folder. The initial public release of
 * Hyperloop includes a Titanium CLI plugin that didn't have the correct
 * directory structure. It should have had the contents in a folder with the
 * name of the version. This CLI hook resolves this issue.
 *
 * @copyright
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const fs = require('fs-extra'),
	path = require('path');

/** The plugin's identifier */
exports.id = 'com.appcelerator.hyperloop-fix';

/**
 * Clean up the Hyperloop plugin folder if need be.
 *
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Object} appc - The node-appc library
 */
exports.init = function init(logger, config, cli, appc) {
	var versionRE = /^\d+\.\d+\.\d+$/;

	cli.env.os.sdkPaths.forEach(function (sdkPath) {
		const hyperloopDir = appc.fs.resolvePath(sdkPath, 'plugins', 'hyperloop'),
			pkgJsonFile = path.join(hyperloopDir, 'package.json');

		if (appc.fs.exists(pkgJsonFile)) {
			const pkgJson = require(pkgJsonFile);// eslint-disable-line security/detect-non-literal-require
			if (pkgJson.version) {
				(function walk(src, dest, root) {
					fs.ensureDirSync(dest);

					fs.readdirSync(src).forEach(function (name) {
						if (!root || !versionRE.test(name)) {
							const from = path.join(src, name),
								to = path.join(dest, name);

							if (fs.statSync(from).isDirectory()) {
								if (appc.fs.exists(to) && !fs.statSync(to).isDirectory()) {
									fs.unlinkSync(to);
								}
								walk(from, to);
								fs.rmdirSync(from);
							} else {
								if (appc.fs.exists(to) && fs.statSync(to).isDirectory()) {
									fs.rmdirSync(to);
								}
								fs.renameSync(from, to);
							}
						}
					});
				}(hyperloopDir, path.join(hyperloopDir, pkgJson.version), true));
			}
		}
	});
};
