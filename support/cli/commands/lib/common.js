/*
 * common.js: Titanium Mobile CLI SDK-specific common library
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	path = require('path'),
	appc = require('node-appc'),
	afs = appc.fs,
	manifest = appc.pkginfo.manifest(module),
	platformAliases = {
		// add additional aliases here for new platforms
		'ipad': 'iphone',
		'ios': 'iphone'
	};

exports.manifest = manifest;

exports.sdkVersion = manifest.version;

exports.commonOptions = function (logger, config) {
	return {
		sdk: {
			abbr: 's',
			default: config.app.sdk || 'latest',
			desc: __('Titanium SDK version to use'),
			required: true
		},
		user: {
			desc: __('user to log in as, if not already logged in')
		},
		password: {
			desc: __('the password to log in with')
		},
		'log-level': {
			callback: function (value) {
				logger.levels[value] && logger.setLevel(value);
			},
			desc: __('minimum logging level'),
			default: config.cli.logLevel || 'warn',
			hint: __('level'),
			values: logger.getLevels()
		}
	};
};

exports.platformOptions = function (logger, config, cli, commandName) {
	var result = {};
	
	// for each platform, fetch their specific flags/options
	commandName && manifest.platforms.forEach(function (platform) {
		var platformCommand = path.join(path.dirname(module.filename), '..', '..', '..', platform, 'cli', 'commands', '_' + commandName + '.js');
		if (afs.exists(platformCommand)) {
			var command = require(platformCommand);
			if (command && command.config) {
				// try to get the platform specific configuration
				var conf = command.config(logger, config, cli),
					title;
				
				try {
					// try to read a title from the platform's package.json
					title = JSON.parse(fs.readFileSync(path.join(path.dirname(module.filename), '..', '..', '..', platform, 'package.json'))).title;
				} catch (e) {}
				
				// add the platform and title to the options and flags
				['options', 'flags'].forEach(function (type) {
					if (conf[type]) {
						result[platform] = {
							platform: platform,
							title: title || platform
						};
						result[platform][type] = conf[type];
					}
				});
			}
		}
	});
	
	return result;
};

exports.validateProjectDir = function(logger, dir) {
	dir = dir || '.';
	
	var d = appc.fs.resolvePath(dir);
	if (!appc.fs.exists(d)) {
		logger.error(__('Project directory does not exist') + '\n');
		process.exit(1);
	}
	
	var tiapp = path.join(d, 'tiapp.xml');
	while (!appc.fs.exists(tiapp) && d != '/') {
		d = path.dirname(d);
		tiapp = path.join(d, 'tiapp.xml');
	}
	
	if (d == '/') {
		logger.error(__('Invalid project directory "%s"', dir) + '\n');
		dir == '.' && logger.log(__("Use the %s property to specify the project's directory", '--dir'.cyan) + '\n');
		process.exit(1);
	}
	
	return d;
};

exports.validatePlatformOptions = function (logger, config, cli, commandName) {
	commandName && manifest.platforms.forEach(function (platform) {
		var platformCommand = path.join(path.dirname(module.filename), '..', '..', '..', platform, 'cli', 'commands', '_' + commandName + '.js');
		if (afs.exists(platformCommand)) {
			var command = require(platformCommand);
			command && command.validate && command.validate(logger, config, cli);
		}
	});
};

exports.availablePlatforms = manifest.platforms;

exports.scrubPlatforms = function (platforms) {
	var r = {
		scrubbed: [], // distinct list of un-aliased platforms
		bad: []
	};
	
	platforms.toLowerCase().split(',').map(function (p) {
		return platformAliases[p] || p;
	}).forEach(function (p) {
		if (manifest.platforms.indexOf(p) == -1) {
			r.bad.push(p);
		} else if (r.scrubbed.indexOf(p) == -1) {
			r.scrubbed.push(p);
		}
	});
	
	return r;
};

exports.validatePlatform = function(logger, platform) {
	var p = platformAliases[platform] || platform;
	if (!p || manifest.platforms.indexOf(p) == -1) {
		logger.error(__('Invalid platform "%s"', platform) + '\n');
		appc.string.suggest(platform, manifest.platforms, logger.log);
		logger.log(__('Available platforms for SDK version %s:', manifest.version));
		manifest.platforms.forEach(function (p) {
			logger.log('    ' + p.cyan);
		});
		logger.log();
		process.exit(1);
	}
	return p;
};

exports.validatePlatforms = function (logger, platforms) {
	var p = platforms;
	// split platforms and make sure each are valid, then return the cleaned up platforms
	return p;
};