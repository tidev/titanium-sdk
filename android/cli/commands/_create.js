/*
 * create.js: Titanium Android CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	path = require('path');

exports.config = function (logger, config, cli) {
	return {
		//
	};
};

exports.run = function (logger, config, cli, projectConfig) {
	var templatePath = afs.resolvePath(path.dirname(module.filename), '..', '..', 'templates', cli.argv.type, cli.argv.template),
		ignoreExtRegExp = /\.(png','.gif','.jpg','.zip','.a','.o', '.jar)$/,
		projectDir = afs.resolvePath(cli.argv['project-dir'], cli.argv.name);
	
	if (afs.exists(templatePath)) {
		if (cli.argv.type == 'app') {
			afs.copyDirSyncRecursive(templatePath, projectDir, {
				ignoreDirs: ['.git','.svn', 'CVS'],
				ignoreFiles: ['.gitignore', '.cvsignore'],
				logger: logger.debug,
				preserve: true
			});
		} else if (cli.argv.type == 'module') {
			afs.copyDirSyncRecursive(templatePath, projectDir, {
				callback: function (src, dest, contents, logger) {
					var result = {
						dest: dest,
						contents: contents
					};
					if (!ignoreExtRegExp.test(src)) {
						result.dest = result.dest.replace(/(___?.+?___?)/g, function (match, key, format) {
							return projectConfig.hasOwnProperty(key) ? projectConfig[key] : key;
						});
						logger && logger(__('Processing %s', result.dest.cyan));
						result.contents = contents.toString().replace(/(___?.+?___?)/g, function (match, key, format) {
							return projectConfig.hasOwnProperty(key) ? projectConfig[key] : key;
						});
					}
					return result;
				},
				ignoreDirs: ['.git','.svn', 'CVS'],
				ignoreFiles: ['.gitignore', '.cvsignore'],
				logger: logger.debug,
				preserve: true
			});
		}
	}
};
