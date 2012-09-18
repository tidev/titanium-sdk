/*
 * create.js: Titanium Mobile Web CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	path = require('path'),
	wrench = require('wrench');

exports.config = function (logger, config, cli) {
	return {
		//
	};
};

exports.run = function (logger, config, cli, projectConfig) {
	var templatePath = afs.resolvePath(path.dirname(module.filename), '..', '..', 'templates', cli.argv.type, cli.argv.template),
		projectDir = afs.resolvePath(cli.argv['project-dir'], cli.argv.name);
	if (afs.exists(templatePath)) {
		wrench.copyDirSyncRecursive(templatePath, projectDir, { preserve: true });
	}
};
