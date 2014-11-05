/**
 * Detects installed Titanium modules.
 *
 * @module timodule
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

const
	__ = require('./i18n')(__dirname).__,
	afs = require('./fs'),
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	util = require('./util'),
	version = require('./version'),
	zip = require('./zip'),

	platformAliases = {
		// add additional aliases here for new platforms
		'ipad': 'iphone',
		'ios': 'iphone'
	};

var moduleCache = {};

exports.scopedDetect = scopedDetect;
exports.detect = detect;
exports.find = find;

/**
 * Scans search paths for Titanium modules. This function will not scan any paths
 * other than the ones explicitly told to scan.
 *
 * @param {Object} searchPaths - An object of scopes to arrays of paths to search for Titanium modules.
 * @param {Object} config - The CLI config.
 * @param {Object} logger - A logger instance.
 * @param {Function} callback - A function to call when done.
 * @param {Boolean} [bypassCache=false] - When true, re-scans the specified paths for modules.
 */
function scopedDetect(searchPaths, config, logger, callback, bypassCache) {
	if (!searchPaths || typeof searchPaths !== 'object') {
		callback();
		return;
	}

	var tasks = [],
		results = {};

	Object.keys(searchPaths).forEach(function (scope) {
		(Array.isArray(searchPaths[scope]) ? searchPaths[scope] : [ searchPaths[scope] ]).forEach(function (searchPath) {
			if (!searchPath) return;
			tasks.push(function (cb) {
				detectModules({
					bypassCache: bypassCache,
					modulesDir: searchPath,
					logger: logger,
					callback: function (err, result) {
						err || (results[scope] = result);
						cb();
					}
				});
			});
		});
	});

	async.parallel(tasks, function () {
		callback(results);
	});
};

/**
 * Scans search paths for Titanium modules. This function will scan all known
 * Titanium SDK locations.
 *
 * @param {Object} params - An object with the following params.
 * @param {Array<String>} [params.searchPaths] - An array of paths to search for Titanium modules.
 * @param {Object} [params.logger] - A logger instance.
 * @param {Function} [params.callback] - A function to call when done.
 * @param {Boolean} [params.bypassCache=false] - When true, re-scans the specified paths for modules.
 */
function detect(paramsOrSearchPaths, logger, callback, bypassCache) {
	var params;

	if (arguments.length === 1 && typeof paramsOrSearchPaths === 'object' && paramsOrSearchPaths !== null) {
		params = paramsOrSearchPaths;
	} else {
		params = {
			bypassCache: bypassCache,
			callback: callback,
			logger: logger,
			searchPaths: paramsOrSearchPaths
		};
	}

	var sdkPaths = [].concat(require('./environ').os.sdkPaths),
		i = sdkPaths.length - 1;

	// resolve all sdk paths
	while (i--) {
		sdkPaths[i] = afs.resolvePath(sdkPaths[i]);
	}

	// non-destructively, but deeply mix two objects
	function mix(src, dest) {
		if (!src || !dest) return;

		Object.keys(src).forEach(function (key) {
			if (!dest[key] || typeof dest[key] !== 'object') {
				dest[key] = {};
			}

			if (src[key] !== null && typeof src[key] === 'object' && !Array.isArray(src[key])) {
				mix(src[key], dest[key]);
			} else {
				dest[key] = src[key];
			}
		});
	}

	async.parallel({
		project: function (next) {
			// resolve all search paths, but also remove a search path if it's already in the sdk paths
			var searchPaths = {},
				results = {};

			(Array.isArray(params.searchPaths) ? params.searchPaths : [ params.searchPaths ]).forEach(function (p) {
				if (!p || searchPaths[p]) return;
				p = afs.resolvePath(p);
				if (sdkPaths.indexOf(p) !== -1) return;
				searchPaths[p] = 1;
			});

			async.each(Object.keys(searchPaths), function (modulePath, cb) {
				detectModules({
					bypassCache: params.bypassCache,
					modulesDir: path.join(modulePath, 'modules'),
					logger: params.logger,
					callback: function (err, result) {
						err || mix(result, results);
						cb();
					}
				});
			}, function () {
				next(null, results);
			});
		},
		global: function (next) {
			var results = {};
			async.each(sdkPaths, function (modulePath, cb) {
				detectModules({
					bypassCache: params.bypassCache,
					modulesDir: path.join(modulePath, 'modules'),
					logger: params.logger,
					callback: function (err, result) {
						err || mix(result, results);
						cb();
					}
				});
			}, function () {
				next(null, results);
			});
		}
	}, function (err, results) {
		typeof params.callback === 'function' && params.callback(results);
	});
};

/**
 * Detects all installed Titanium modules, then it will validate that the
 * specified modules are found, incompatible, missing, or conflicting.
 *
 * @param {Object} params - An object with the following params.
 * @param {Array<Object>|Object} [params.modules] - An array of modules to search for.
 * @param {Array<String>|String} [params.platforms] - An array of platform names (if the platform has more than one name) or a string of comma-separated platform names.
 * @param {Array<String>|String} [params.deployType] - An array of deploy types or a string of comma-separated deploy types to filter by.
 * @param {String} [params.sdkVersion] - The version of the Titanium SDK to be used for the minimum SDK check.
 * @param {Array<String>} [params.searchPaths] - An array of paths to search for Titanium modules.
 * @param {Object} [params.logger] - A logger instance.
 * @param {Function} [params.callback] - A function to call when done.
 * @param {Boolean} [params.bypassCache=false] - When true, re-detects all modules.
 */
function find(modulesOrParams, platforms, deployType, sdkVersion, searchPaths, logger, callback, bypassCache) {
	var params,
		result = {
			found: [],
			missing: [],
			incompatible: [],
			conflict: []
		},
		visited = {},
		modulesById = {};

	if (arguments.length === 1 && typeof modulesOrParams === 'object' && modulesOrParams !== null) {
		params = modulesOrParams;
	} else {
		params = {
			bypassCache: bypassCache,
			callback: callback,
			deployType: deployType,
			logger: logger,
			modules: modulesOrParams,
			platforms: platforms,
			sdkVersion: sdkVersion,
			searchPaths: searchPaths
		};
	}

	// clean up platforms
	if (typeof params.platforms === 'string') {
		params.platforms = params.platforms.split(',').filter(function (p) { return p; });
	} else if (Array.isArray(params.platforms)) {
		params.platforms = params.platforms.filter(function (p) { return p; });
	} else {
		params.platforms = [];
	}
	params.platforms.indexOf('commonjs') === -1 && params.platforms.push('commonjs'); // add commonjs to the list of valid module platforms

	detect({
		searchPaths: params.searchPaths,
		bypassCache: params.bypassCache,
		logger: params.logger,
		callback: function (installed) {
			params.modules && params.modules.forEach(function (module) {
				var originalVersion = module.version || 'latest',
					scopes = ['project', 'global'],
					i, j, scope, info, platform, found, ver, tmp;

				// make sure the module has a valid array of platforms
				module.platform || (module.platform = params.platforms);
				Array.isArray(module.platform) || (module.platform = module.platform.split(','));

				module.deployType || (module.deployType = params.deployType);
				Array.isArray(module.deployType) || (module.deployType = module.deployType.split(','));

				// if this module doesn't support any of the platforms we're building for, skip it
				if (module.deployType.indexOf(params.deployType) === -1 || !module.platform.some(function (a) { return params.platforms.indexOf(a) !== -1; })) {
					return;
				}

				// strip all platforms that aren't supported by this build
				for (i = 0; i < module.platform.length; i++) {
					if (params.platforms.indexOf(module.platform[i]) === -1) {
						module.platform.splice(i--, 1);
					} else if (platformAliases[module.platform[i]] && module.platform.indexOf(platformAliases[module.platform[i]]) === -1) {
						module.platform.push(platformAliases[module.platform[i]]);
					}
				}

				var key = module.id + '|' + module.deployType.join(',') + '|' + module.platform.join(',') + '|' + module.version;
				if (visited[key]) return;
				visited[key] = 1;

				params.logger && params.logger.debug(__('Looking for Titanium module id=%s version=%s platform=%s deploy-type=%s', module.id.cyan, originalVersion.cyan, module.platform.join(',').cyan, module.deployType.join(',').cyan));

				// loop through each scope (project, global)
				for (i = 0; i < scopes.length; i++) {
					scope = installed[scopes[i]];
					if (!scope) continue;

					// loop through each platform attribute from <module platform="ios,android">
					for (j = 0; j < module.platform.length; j++) {
						platform = module.platform[j];

						// check that we even have a module with the specified id and platform
						if (!scope[platform] || !scope[platform][module.id]) continue;

						// sort all versions
						Object.keys(scope[platform][module.id]).sort().reverse().filter(function (ver) {
							return !module.version || ver === module.version;
						}).forEach(function (ver) {
							info = scope[platform][module.id][ver];
							if (!info) return;

							tmp = util.mix({}, module, info);
							if (params.sdkVersion && info.manifest && info.manifest.minsdk && version.gt(info.manifest.minsdk, params.sdkVersion)) {
								params.logger && params.logger.debug(__('Found incompatible Titanium module id=%s version=%s platform=%s deploy-type=%s', tmp.id.cyan, tmp.version.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan));
								result.incompatible.push(tmp);
								return;
							}

							// make sure we haven't already added this module
							var alreadyAdded = false,
								foundBetter = false,
								addToModuleMap = true;

							for (var k = 0; k < result.found.length; k++) {
								if (result.found[k].id === tmp.id) {
									// if we find a the same module twice, but the versions differ
									if (originalVersion === 'latest') {
										if (version.lt(result.found[k].version, ver)) {
											// found a better module
											params.logger && params.logger.info(__('Found better matching module id=%s version=%s platform=%s deploy-type=%s path=%s', tmp.id.cyan, originalVersion.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan, tmp.modulePath.cyan));
											result.found.splice(k, 1);
											foundBetter = true;
										} else if (version.eq(result.found[k].version, ver)) {
											alreadyAdded = true;
											if (result.found[k].platform.map(function (p) { return platformAliases[p] || p; }).indexOf(platformAliases[platform] || platform) !== -1) {
												addToModuleMap = false;
											}
										} else {
											alreadyAdded = true;
										}
									} else if (version.eq(result.found[k].version, ver)) {
										alreadyAdded = true;
										if (result.found[k].platform.indexOf(platformAliases[platform] || platform) !== -1) {
											addToModuleMap = false;
										}
									}
								}
							}

							if (!alreadyAdded) {
								tmp.platform = [ platform ];
								!foundBetter && params.logger && params.logger.info(__('Found Titanium module id=%s version=%s platform=%s deploy-type=%s path=%s', tmp.id.cyan, tmp.version.cyan, tmp.platform.join(',').cyan, tmp.deployType.join(',').cyan, tmp.modulePath.cyan));
								result.found.push(tmp);
							}

							if (addToModuleMap) {
								// add this module to a hash so we can check later for conflicts
								modulesById[module.id] || (modulesById[module.id] = []);
								modulesById[module.id].push(tmp);
							}

							// since we found a valid version, remove this module if was previously detected as incompatible
							for (var x = 0; x < result.incompatible.length; x++) {
								if (result.incompatible[x].id === tmp.id) {
									result.incompatible.splice(x--, 1);
								}
							}

							found = true;
						});
					}
				}

				if (!found) {
					params.logger && params.logger.warn(__('Could not find a valid Titanium module id=%s version=%s platform=%s deploy-type=%s', module.id.cyan, originalVersion.cyan, module.platform.join(',').cyan, module.deployType.join(',').cyan));
					result.missing.push(module);
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

				if (len <= 1) return;

				// we have a potential conflict...
				// verify that we have at least one commonjs platform and at least one non-commonjs platform
				for (i = 0; i < len; i++) {
					platforms = Array.isArray(mods[i].platform) ? mods[i].platform : [mods[i].platform];
					platforms.forEach(function (p) {
						if (p.toLowerCase() === 'commonjs') {
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
						if (result.found[i].id === id) {
							result.found.splice(i--, 1);
						}
					}
				}
			});

			typeof params.callback === 'function' && params.callback(result);
		}
	});
};

/**
 * Searches an array of paths for Titanium modules. If it encounters a zip file
 * that matches module zip filename pattern, it will automatically unzip it and
 * remove the zip file prior to detecting modules.
 *
 * @param {Object} params - An object with the following params.
 * @param {Array<String>} params.modulesDir - An array of paths to search for Titanium modules.
 * @param {Boolean} [params.bypassCache=false] - When true, re-scans the specified path for modules.
 * @param {Function} [params.callback] - A function to call when done.
 * @param {Object} [params.config] - The CLI config.
 * @param {Object} [params.logger] - A logger instance.
 *
 * @private
 */
function detectModules(params) {
	var modulesDir = params.modulesDir,
		callback = typeof params.callback === 'function' ? params.callback : function () {};

	// make sure they specified a modulesDir
	if (!modulesDir) return callback(new Error(__('Missing required argument "%s"', 'modulesDir')));

	if (moduleCache[modulesDir] && !params.bypassCache) {
		return callback(null, moduleCache[modulesDir]);
	}

	var results = {},
		zipRegExp = /^.+\-.+?\-.+?\.zip$/,
		osNamesRegExp = /^osx|win32|linux$/,
		ignoreDirs = new RegExp(params.config && params.config.get('cli.ignoreDirs') || '^(.svn|.git|.hg|.?[Cc][Vv][Ss]|.bzr)$'),
		moduleRoot = path.resolve(params.modulesDir, '..');

	// make sure the module's parent dir (the root) exists
	if (!fs.existsSync(moduleRoot)) return callback(null, results);

	// auto-install zipped modules
	async.each(fs.readdirSync(moduleRoot), function (name, next) {
		var file = path.join(moduleRoot, name);
		if (!zipRegExp.test(name) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();

		params.logger && params.logger.info(__('Installing module: %s', name));
		zip.unzip(file, moduleRoot, null, function (err) {
			if (err) {
				params.logger && params.logger.error(__('Failed to unzip module "%s"', file));
			} else {
				fs.unlinkSync(file);
			}
			next();
		});
	}, function () {
		if (!fs.existsSync(modulesDir)) return callback(null, results);

		params.logger && params.logger.debug(__('Detecting modules in %s', modulesDir.cyan));

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
										if (line.charAt(0) !== '#' && p !== -1) {
											mod[ver].manifest[line.substring(0, p)] = line.substring(p + 1).trim();
										}
									});

									if (mod[ver].manifest && mod[ver].manifest.platform) {
										mod[ver].platform = [ mod[ver].manifest.platform ];
										if (mod[ver].manifest.platform === 'iphone') {
											mod[ver].platform.unshift('ios');
										}
									}

									params.logger && params.logger.debug(__('Detected %s module: %s %s @ %s', platform, mod[ver].manifest.moduleid.cyan, ver, mod[ver].modulePath));
								}
							}
						});
					}
				});
			}
		});

		callback(null, moduleCache[modulesDir] = results);
	});
}
