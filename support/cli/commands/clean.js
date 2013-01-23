/*
 * clean.js: Titanium Mobile CLI clean command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	ti = require('titanium-sdk'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench');

exports.cliVersion = '>=3.X';
exports.desc = __('removes previous build directories');

exports.config = function (logger, config, cli) {
	return {
		options: appc.util.mix({
			platform: {
				// this is for backwards compatibility and eventually should be dropped
				hidden: true
			},
			platforms: {
				// note: --platforms is not required for the clean command
				abbr: 'p',
				desc: __('one or more platforms to clean'),
				values: ti.targetPlatforms,
				skipValueCheck: true // we do our own validation
			},
			'project-dir': {
				abbr: 'd',
				desc: __('the directory containing the project, otherwise the current working directory')
			}
		}, ti.commonOptions(logger, config))
	};
};

exports.validate = function (logger, config, cli) {
	var platforms = cli.argv.platforms || cli.argv.platform;
	if (platforms) {
		platforms = ti.scrubPlatforms(platforms);
		
		if (platforms.bad.length) {
			logger.error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', platforms.bad.length, platforms.bad.join(', ')) + '\n');
			logger.log(__('Available platforms for SDK version %s:', ti.manifest.sdkVersion) + '\n');
			ti.targetPlatforms.forEach(function (p) {
				logger.log('    ' + p.cyan);
			});
			logger.log();
			process.exit(1);
		}
		
		cli.argv.platforms = platforms.scrubbed;
	} else {
		cli.argv.platforms = null;
	}
	
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
};

exports.run = function (logger, config, cli) {
	var buildDir = path.join(cli.argv['project-dir'], 'build');
	
	if (cli.argv.platforms) {
		cli.argv.platforms.forEach(function (platform) {
			var dir = path.join(buildDir, platform);
			if (appc.fs.exists(dir)) {
				logger.debug(__('Deleting %s', dir.cyan));
				wrench.rmdirSyncRecursive(dir);
			} else {
				logger.debug(__('Directory does not exist %s', dir.cyan));
			}
		});
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
