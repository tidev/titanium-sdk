/*
 * create.js: Titanium iOS CLI create command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	path = require('path');

exports.run = function (logger, config, cli, projectConfig) {
	var templatePath = appc.fs.resolvePath(path.dirname(module.filename), '..', '..', 'templates', cli.argv.type, cli.argv.template, 'template'),
		projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], cli.argv.name);
	if (fs.existsSync(templatePath)) {
		appc.fs.copyDirSyncRecursive(templatePath, projectDir, { preserve: true, logger: logger.debug });
	}
};
