/**
 * Detects installed Titanium modules.
 *
 * @module timodule
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
	version = require('./version'),
	util = require('./util'),
	version = require('./version'),
	zip = require('./zip'),
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	moduleCache,
	platformAliases = {
		// add additional aliases here for new platforms
		'ipad': 'iphone',
		'ios': 'iphone'
	};

/**
 * Scans search paths for Titanium modules. This function will not scan any paths
 * other than the ones explicitly told to scan.
 * @param {Object} searchPaths - An object of scopes to arrays of paths to search for Titanium modules
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
			detectModules(searchPaths[scope], config, logger, next);
		};
	});

	async.parallel(tasks, function (err, result) {
		callback(result);
	});
};

/**
 * Scans search paths for Titanium modules. This function will scan all known
 * Titanium SDK locations.
 * @param {Array<String>} searchPaths - An array of paths to search for Titanium modules
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 */
exports.detect = function detect(searchPaths, logger, callback, bypassCache) {
	if (moduleCache && !bypassCache) {
		return callback(moduleCache);
	}

	var sdkPaths = [].concat(require('./environ').os.sdkPaths),
		i = sdkPaths.length - 1;

	// resolve all sdk paths
	while (i--) {
		sdkPaths[i] = afs.resolvePath(sdkPaths[i]);
	}

	// resolve all search paths, but also remove a search path if it's already in the sdk paths
	for (i = 0; i < searchPaths.length; i++) {
		searchPaths[i] = afs.resolvePath(searchPaths[i]);
		if (sdkPaths.indexOf(searchPaths[i]) != -1) {
			searchPaths.splice(i--, 1);
		}
	}

	async.parallel({
		project: function (next) {
			detectModules(searchPaths.map(function (p) {
				return path.join(p, 'modules');
			}), null, logger, next);
		},
		global: function (next) {
			detectModules(sdkPaths.map(function (p) {
				return path.join(p, 'modules');
			}), null, logger, next);
		}
	}, function (err, results) {
		callback(moduleCache = results);
	});
};

/**
 * Detects all installed Titanium modules, then it will validate that the
 * specified modules are found, incompatible, missing, or conflicting.
 * @param {Array<Object>} modules - An array of modules to search for
 * @param {Array<String>|String} platforms - An array of platform names (if the platform
 *        has more than one name) or a string of comma-separated platform names
 * @param {Array<String>|String} deployType - An array of deploy types or a string of
 *        comma-separated deploy types to filter by
 * @param {String} sdkVersion - The version of the Titanium SDK to be used for the minimum SDK check
 * @param {Array<String>} searchPaths - An array of paths to search for Titanium modules
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 */
exports.find = function find(modules, platforms, deployType, sdkVersion, searchPaths, logger, callback) {
	var result = {
			found: [],
			missing: [],
			incompatible: [],
			conflict: []
		},
		visited = {},
		modulesById = {};

	// if there are no modules to find, then just exit now
	if (!modules || !modules.length) return callback(result);

	Array.isArray(platforms) || (platforms = [platforms]);
	platforms.push('commonjs'); // add commonjs to the list of valid module platforms

	exports.detect(searchPaths, logger, function (installed) {
		modules.forEach(function (module) {
			var originalVersion = module.version || 'latest',
				scopes = ['project', 'global'],
				i, j, scope, info, platform, found, ver, tmp;

			// make sure the module has a valid array of platforms
			module.platform || (module.platform = platforms);
			Array.isArray(module.platform) || (module.platform = module.platform.split(','));

			module.deployType || (module.deployType = deployType);
			Array.isArray(module.deployType) || (module.deployType = module.deployType.split(','));

			if (module.deployType.indexOf(deployType) != -1) {
				// if this module doesn't support any of the platforms we're building for, skip it
				if (!module.platform.some(function (a) { return platforms.indexOf(a) != -1; })) {
					return;
				}

				// strip all platforms that aren't supported by this build
				for (i = 0; i < module.platform.length; i++) {
					if (platforms.indexOf(module.platform[i]) == -1) {
						module.platform.splice(i--, 1);
					} else if (platformAliases[module.platform[i]] && module.platform.indexOf(platformAliases[module.platform[i]]) == -1) {
						module.platform.push(platformAliases[module.platform[i]]);
					}
				}

				var key = module.id + '|' + module.deployType.join(',') + '|' + module.platform.join(',') + '|' + module.version;
				if (visited[key]) return;
				visited[key] = 1;

				logger && logger.debug(__('Looking for Titanium module id=%s version=%s platform=%s deploy-type=%s', module.id.cyan, originalVersion.cyan, module.platform.join(',').cyan, module.deployType.join(',').cyan));

				for (i = 0; i < scopes.length; i++) {
					scope = installed[scopes[i]];
					for (j = 0; j < module.platform.length; j++) {
						platform = module.platform[j];
						if (scope[platform] && scope[platform][module.id]) {
							ver = module.version || Object.keys(scope[platform][module.id]).sort().pop();
							info = scope[platform][module.id][ver];
							if (info) {
								tmp = util.mix({}, module, info);
								if (sdkVersion && info.manifest && info.manifest.minsdk && version.gt(info.manifest.minsdk, sdkVersion)) {
									logger && logger.debug(__('Found incompatible Titanium module id=%s version=%s platform=%s deploy-type=%s', tmp.id.cyan, originalVersion.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan));
									result.incompatible.push(tmp);
								} else {
									// make sure we haven't already added this module
									var alreadyAdded = false,
										foundBetter = false,
										addToModuleMap = true;

									for (var k = 0; k < result.found.length; k++) {
										if (result.found[k].id == tmp.id) {
											// if we find a the same module twice, but the versions differ
											if (originalVersion == 'latest') {
												if (version.lt(result.found[k].version, ver)) {
													// found a better module
													logger && logger.info(__('Found better matching module id=%s version=%s platform=%s deploy-type=%s path=%s', tmp.id.cyan, originalVersion.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan, tmp.modulePath.cyan));
													result.found.splice(k, 1);
													foundBetter = true;
												} else if (version.eq(result.found[k].version, ver)) {
													alreadyAdded = true;
													if (result.found[k].platform.map(function (p) { return platformAliases[p] || p; }).indexOf(platformAliases[platform] || platform) != -1) {
														addToModuleMap = false;
													}
												} else {
													alreadyAdded = true;
												}
											} else if (version.eq(result.found[k].version, ver)) {
												alreadyAdded = true;
												if (result.found[k].platform.indexOf(platformAliases[platform] || platform) != -1) {
													addToModuleMap = false;
												}
											}
										}
									}

									if (!alreadyAdded) {
										tmp.platform = [ platform ];

										!foundBetter && logger && logger.info(__('Found Titanium module id=%s version=%s platform=%s deploy-type=%s path=%s', tmp.id.cyan, originalVersion.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan, tmp.modulePath.cyan));
										result.found.push(tmp);
									}

									if (addToModuleMap) {
										// add this module to a hash so we can check later for conflicts
										modulesById[module.id] || (modulesById[module.id] = []);
										modulesById[module.id].push(tmp);
									}
								}
								found = true;
							}
						}
					}
				}

				if (!found) {
					logger && logger.warn(__('Could not find Titanium module id=%s version=%s platform=%s deploy-type=%s', module.id.cyan, originalVersion.cyan, module.platform.join(',').cyan, module.deployType.join(',').cyan));
					result.missing.push(module);
				}
			}
		});

		// detect conflicts
		Object.keys(modulesById).forEach(function (id) {
			var mods = modulesById[id],
				i,
				len = mods.length,
				commonJs = 0,
				nonCommonJs = 0,
				platforms;

			if (len > 1) {
				// we have a potential conflict...
				// verify that we have at least one commonjs platform and at least one non-commonjs platform
				for (i = 0; i < len; i++) {
					platforms = Array.isArray(mods[i].platform) ? mods[i].platform : [mods[i].platform];
					platforms.forEach(function (p) {
						if (p.toLowerCase() == 'commonjs') {
							commonJs++;
						} else {
							nonCommonJs++;
						}
					});
				}
				if (commonJs && nonCommonJs) {
					result.conflict.push({
						id: id,
						modules: mods
					});

					// remove from found
					for (i = 0; i < result.found.length; i++) {
						if (result.found[i].id == id) {
							result.found.splice(i--, 1);
						}
					}
				}
			}
		});

		callback(result);
	});
};

/**
 * Searches an array of paths for Titanium modules. If it encounters a zip file
 * that matches module zip filename pattern, it will automatically unzip it and
 * remove the zip file prior to detecting modules.
 * @param {Array<String>} searchPaths - An array of paths to search for Titanium modules
 * @param {Object} config - The CLI config
 * @param {Object} logger - A logger instance
 * @param {Function} callback - A function to call when done
 * @private
 */
function detectModules(searchPaths, config, logger, callback) {
	var results = {},
		zipRegExp = /^.+\-.+?\-.+?\.zip$/,
		osNamesRegExp = /^osx|win32|linux$/,
		ignoreDirs = new RegExp(config && config.get('cli.ignoreDirs') || '^(.svn|.git|.hg|.?[Cc][Vv][Ss]|.bzr)$');

	Array.isArray(searchPaths) || (searchPaths = [searchPaths]);

	async.parallel(searchPaths.map(function (modulesDir) {
		return function(cb) {
			if (!fs.existsSync(modulesDir)) return cb();

			var moduleRoot = path.join(modulesDir, '..'),
				tasks = [];

			// auto-install zipped modules
			fs.readdirSync(moduleRoot).forEach(function (file) {
				var moduleZip = path.join(moduleRoot, file);
				if (fs.existsSync(moduleZip) && fs.statSync(moduleZip).isFile() && zipRegExp.test(file)) {
					tasks.push(function (taskDone) {
						logger && logger.info(__('Installing module: %s', file));
						zip.unzip(moduleZip, moduleRoot, null, function (err) {
							if (err) {
								logger && logger.error(__('Failed to unzip module "%s"', moduleZip));
							} else {
								fs.unlinkSync(moduleZip);
							}
							taskDone();
						});
					});
				}
			});

			async.parallel(tasks, function () {
				if (!fs.existsSync(modulesDir)) return cb();

				logger && logger.debug(__('Detecting modules in %s', modulesDir.cyan));

				// loop through platforms
				fs.readdirSync(modulesDir).forEach(function (platform) {
					var modulesPath = path.join(modulesDir, platform);
					if (fs.existsSync(modulesPath) && fs.statSync(modulesPath).isDirectory() && !osNamesRegExp.test(platform) && !ignoreDirs.test(platform)) {
						// loop through module names
						fs.readdirSync(modulesPath).forEach(function (moduleName) {
							var modulePath = path.join(modulesPath, moduleName);
							if (fs.existsSync(modulePath) && fs.statSync(modulePath).isDirectory() && !ignoreDirs.test(moduleName)) {
								// loop through versions
								fs.readdirSync(modulePath).forEach(function (ver) {
									if (ignoreDirs.test(ver)) return;
									var versionPath = path.join(modulePath, ver),
										manifestFile = path.join(versionPath, 'manifest');
									if (fs.existsSync(versionPath) && fs.statSync(versionPath).isDirectory() && fs.existsSync(manifestFile)) {
										var dest = results[platform] || (results[platform] = {}),
											mod = dest[moduleName] || (dest[moduleName] = {});

										if (!mod[ver]) {
											mod[ver] = {
												modulePath: versionPath,
												version: ver,
												manifest: {}
											};

											fs.readFileSync(manifestFile).toString().split('\n').forEach(function (line) {
												var p = line.indexOf(':');
												if (line.charAt(0) != '#' && p != -1) {
													mod[ver].manifest[line.substring(0, p)] = line.substring(p + 1).trim();
												}
											});

											logger && logger.debug(__('Detected %s module: %s %s @ %s', platform, mod[ver].manifest.moduleid.cyan, ver, mod[ver].modulePath));
										}
									}
								});
							}
						});
					}
				});

				cb();
			});
		};
	}), function (err) {
		callback(err, results);
	});
}
