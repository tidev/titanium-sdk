/*
 * clean.js: Titanium Mobile CLI clean command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	ti = require('titanium-sdk'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench');

exports.cliVersion = '>=3.X';
exports.desc = __('creates a new mobile application or module');

exports.config = function (logger, config, cli) {
	return {
		options: appc.util.mix({
			platform: {
				// note: --platform is not required for the clean command
				abbr: 'p',
				desc: __('a platform to clean'),
				values: ti.availablePlatforms
			},
			'project-dir': {
				abbr: 'd',
				desc: __('the directory containing the project, otherwise the current working directory')
			}
		}, ti.commonOptions(logger, config))
	};
};

exports.validate = function (logger, config, cli) {
	cli.argv.platform && ti.validatePlatform(logger, cli.argv, 'platform');
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	ti.loadPlugins(logger, cli, cli.argv['project-dir']);
};

exports.run = function (logger, config, cli) {
	var buildDir = path.join(cli.argv['project-dir'], 'build');
	
	logger.debug(__('Touching tiapp.xml'));
	appc.fs.touch(path.join(cli.argv['project-dir'], 'tiapp.xml'));
	
	if (cli.argv.platform) {
		var dir = path.join(buildDir, cli.argv.platform);
		if (appc.fs.exists(dir)) {
			logger.debug(__('Deleting %s', dir.cyan));
			wrench.rmdirSyncRecursive(dir);
		} else {
			logger.debug(__('Directory does not exist %s', dir.cyan));
		}
	} else if (appc.fs.exists(buildDir)) {
		logger.debug(__('Deleting all platform build directories'));
		fs.readdirSync(buildDir).forEach(function (dir) {
			dir = path.join(buildDir, dir);
			if (fs.lstatSync(dir).isDirectory()) {
				logger.debug(__('Deleting %s', dir.cyan));
				wrench.rmdirSyncRecursive(dir);
			}
		});
	} else {
		logger.debug(__('Directory does not exist %s', buildDir.cyan));
	}
	
	logger.info(__('Project cleaned successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
};
