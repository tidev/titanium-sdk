/*
 * create.js: Titanium Android CLI create command
 *
 * Copyright (c) 2012-2014, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fs = require('fs');

exports.run = function (logger, config, cli, projectConfig, callback) {
	var templatePath = appc.fs.resolvePath(__dirname, '..', '..', 'templates', cli.argv.type, cli.argv.template, 'template'),
		projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], cli.argv.name);

	if (fs.existsSync(templatePath)) {
		appc.fs.copyDirSyncRecursive(templatePath, projectDir, {
			ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
			ignoreFiles: new RegExp(config.get('cli.ignoreFiles')),
			logger: logger.debug,
			preserve: true
		});
	}

	callback();
};
