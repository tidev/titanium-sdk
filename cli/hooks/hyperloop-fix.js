/**
 * Cleans up the Hyperloop plugin folder. The initial public release of
 * Hyperloop includes a Titanium CLI plugin that didn't have the correct
 * directory structure. It should have had the contents in a folder with the
 * name of the version. This CLI plugin resolves this issue.
 *
 * @copyright
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

var path = require('path');
var fs = require('fs');

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
	appc.env.os.sdkPaths.forEach(function (sdkPath) {
		var hyperloopDir = appc.fs.resolvePath(sdkPath, 'plugins', 'hyperloop');
		if (appc.fs.exists(hyperloopDir)) {
			console.log('!!!!!!!', hyperloopDir);
		}
	});
};
