/**
 * Detects installed Titanium CLI plugins.
 *
 * @module tiplugin
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var __ = require('./i18n')(__dirname).__,
	afs = require('./fs'),
	util = require('./util'),
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	vm = require('vm'),
	pluginCache;

/**
 * Scans search paths for Titanium CLI plugins. This function will not scan any
 * paths other than the ones explicitly told to scan.
 * @param {Array<String>} searchPaths - An array of paths to search for Titanium CLI plugins
 * @param {Object} config - The CLI config
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 */
exports.scopedDetect = function scopedDetect(searchPaths, config, logger, callback) {
	if (!searchPaths || typeof searchPaths != 'object') {
		callback();
		return;
	}

	var tasks = {};
	Object.keys(searchPaths).forEach(function (scope) {
		tasks[scope] = function (next) {
			detectPlugins(searchPaths[scope], config, logger, next);
		};
	});

	async.parallel(tasks, function (err, result) {
		callback(result);
	});
};

/**
 * Scans a project directory as well as global and user-configured search paths
 * for Titanium CLI plugins.
 * @param {String} projectDir - Path to the project directory
 * @param {Object} config - The CLI config
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 */
exports.detect = function detect(projectDir, config, logger, callback, bypassCache) {
	if (pluginCache && !bypassCache) {
		return callback(pluginCache);
	}
	async.parallel({
		project: function (next) {
			detectPlugins(path.join(projectDir, 'plugins'), config, logger, next);
		},
		user: function (next) {
			if (config.paths && Array.isArray(config.paths.plugins)) {
				detectPlugins(config.paths.plugins, config, logger, next);
			} else {
				next();
			}
		},
		global: function (next) {
			detectPlugins(require('./environ').os.sdkPaths.map(function (p) {
				return path.join(p, 'plugins');
			}), config, logger, next);
		}
	}, function (err, results) {
		callback(pluginCache = results);
	});
};

/**
 * Detects all installed Titanium CLI plugins, then it will validate that the
 * specified plugins are found or missing.
 * @param {Array<Object>} plugins - An array of plugins to search for
 * @param {Object|String} searchPaths - An object containing search paths or the
 * path to the project directory
 * @param {Object} config - The CLI config
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 */
exports.find = function find(plugins, searchPaths, config, logger, callback) {
	// if there are plugins to find, then just exit now
	if (!plugins || !plugins.length) {
		return callback({
			found: [],
			missing: []
		});
	}

	function process(installed) {
		var result = {
				found: [],
				missing: []
			},
			visited = {};

		plugins.forEach(function (plugin) {
			var originalVersion = plugin.version || 'latest',
				scopes = ['project', 'config', 'user', 'global'], // the order here represents precendence ('user' is legacy, now we use 'config')
				i, j, scope, info, platform, found;

			if (!plugin.version) {
				scopes.forEach(function(scope) {
					// search both project and global plugins for the latest version
					var x = installed[scope];
					if (!plugin.version && x && x[plugin.id]) {
						plugin.version = Object.keys(x[plugin.id]).sort().pop();
					}
				});
			}

			var key = plugin.id + '|' + plugin.version;
			if (visited[key]) return;
			visited[key] = 1;

			logger && logger.debug(__('Looking for Titanium plugin id=%s version=%s', plugin.id.cyan, originalVersion.cyan));

			for (i = 0; !found && i < scopes.length; i++) {
				scope = installed[scopes[i]];
				if (scope && scope[plugin.id]) {
					info = scope[plugin.id][plugin.version] || scope[plugin.id]['unknown'] || scope[plugin.id]['-'];
					if (info) {
						util.mix(plugin, info);
						logger && logger.info(__('Found Titanium plugin id=%s version=%s ', plugin.id.cyan, originalVersion.cyan));
						result.found.push(plugin);
						found = true;
					}
				}
			}

			if (!found) {
				logger && logger.warn(__('Could not find Titanium plugin id=%s version=%s', plugin.id.cyan, originalVersion.cyan));
				result.missing.push(plugin);
			}
		});

		callback(result);
	}

	if (typeof searchPaths == 'string') {
		// searchPaths is the project directory
		exports.detect(searchPaths, config, logger, process);
	} else {
		// searchPaths is an object of paths
		exports.scopedDetect(searchPaths, config, logger, process);
	}
};

/**
 * Searches an array of paths for Titanium CLI plugins.
 * @param {Array<String>} searchPaths - An array of paths to search for Titanium CLI plugins
 * @param {Object} config - The CLI config
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 * @private
 */
function detectPlugins(searchPaths, config, logger, callback) {
	var results = {},
		ignoreDirs = new RegExp(config && config.get('cli.ignoreDirs') || '^(.svn|.git|.hg|.?[Cc][Vv][Ss]|.bzr)$');

	Array.isArray(searchPaths) || (searchPaths = [searchPaths]);

	searchPaths.forEach(function (pluginRoot) {
		pluginRoot = afs.resolvePath(pluginRoot);
		if (!fs.existsSync(pluginRoot)) return;

		logger && logger.debug(__('Detecting plugins in %s', pluginRoot.cyan));

		var packageFile = path.join(pluginRoot, 'package.json'),
			packageFileExists = fs.existsSync(packageFile),
			pluginFile = path.join(pluginRoot, 'plugin.py'),
			pluginFileExists = fs.existsSync(pluginFile),
			pluginName = path.basename(pluginRoot);

		// check if this search path is plugin folder
		if (packageFileExists || pluginFileExists) {
			// we have a plugin without a version folder
			var plugin = results[pluginName] || (results[pluginName] = {});
			plugin['-'] = {
				pluginPath: pluginRoot
			};

			if (packageFileExists) {
				try {
					plugin['-'].manifest = JSON.parse(fs.readFileSync(packageFile));
				} catch (e) {}
			}

			if (pluginFileExists) {
				plugin['-'].legacyPluginFile = pluginFile;
			}

			logger && logger.debug(__('Detected plugin: %s @ %s', pluginName.cyan, pluginRoot.cyan));
		} else {
			// loop through plugin names
			fs.readdirSync(pluginRoot).forEach(function (pluginName) {
				var pluginsPath = path.join(pluginRoot, pluginName);
				if (fs.existsSync(pluginsPath) && fs.statSync(pluginsPath).isDirectory() && !ignoreDirs.test(pluginName)) {
					// we have a plugin directory

					function processDir(ver, versionPath, dest) {
						var packageFile = path.join(versionPath, 'package.json'),
							packageFileExists = fs.existsSync(packageFile),
							pluginFile = path.join(versionPath, 'plugin.py'),
							pluginFileExists = fs.existsSync(pluginFile),
							plugin,
							jsfile = /\.js$/,
							ignore = /^[\._]/;

						dest.pluginPath = versionPath;
						dest.commands = [];
						dest.hooks = [];
						dest.legacyPluginFile = pluginFileExists ? pluginFile : null;
						dest.manifest = {};

						if (packageFileExists) {
							try {
								dest.manifest = JSON.parse(fs.readFileSync(packageFile));
							} catch (e) {}
						}

						var commandsDir = path.join(versionPath, 'commands');
						if (fs.existsSync(commandsDir) && fs.statSync(commandsDir).isDirectory()) {
							fs.readdirSync(commandsDir).forEach(function (filename) {
								var file = path.join(commandsDir, filename);
								if (fs.statSync(file).isFile() && jsfile.test(filename) && !ignore.test(filename)) {
									dest.commands.push({
										name: filename.replace(jsfile, '')
									});
								}
							});
						}

						var hooksDir = path.join(versionPath, 'hooks');
						if (fs.existsSync(hooksDir) && fs.statSync(hooksDir).isDirectory()) {
							fs.readdirSync(hooksDir).forEach(function (filename) {
								var file = path.join(hooksDir, filename);
								if (fs.statSync(file).isFile() && jsfile.test(filename) && !ignore.test(filename)) {
									var info = {
										name: filename.replace(jsfile, ''),
										path: file
									};

									try {
										vm.runInThisContext('(function (exports, require, module, __filename, __dirname) { ' + fs.readFileSync(file).toString() + '\n});', file, 0, false);
										var mod = require(file);
										mod.name && (info.name = mod.name);
										mod.cliVersion && (info.cliVersion = mod.cliVersion);
										mod.version && (info.version = mod.version);
									} catch (ex) {}

									dest.hooks.push(info);
								}
							});
						}

						if (ver) {
							logger && logger.debug(__('Detected plugin: %s %s @ %s', pluginName.cyan, ver, versionPath.cyan));
						} else {
							logger && logger.debug(__('Detected plugin: %s @ %s', pluginName.cyan, versionPath.cyan));
						}
					}

					var packageFileExists = fs.existsSync(path.join(pluginsPath, 'package.json')),
						pluginName = path.basename(pluginsPath);

					if (packageFileExists || fs.existsSync(path.join(pluginsPath, 'plugin.py'))) {
						// we have a plugin without a version folder or a project level plugin
						results[pluginName] || (results[pluginName] = {});
						processDir(null, pluginsPath, results[pluginName].unknown = {});
					} else {
						// loop through versions
						fs.readdirSync(pluginsPath).forEach(function (ver) {
							var dir = path.join(pluginsPath, ver);
							if (!ignoreDirs.test(ver) && fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
								results[pluginName] || (results[pluginName] = {});
								processDir(ver, dir, results[pluginName][ver] = {});
							}
						});
					}
				}
			});
		}
	});

	callback(null, results);
}
