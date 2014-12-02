/**
 * Detects if Java and the JDK are installed.
 *
 * @module jdk
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var __ = require('./i18n')(__dirname).__,
	mix = require('./util').mix,
	sp = require('./subprocess'),
	run = sp.run,
	findExecutable = sp.findExecutable,
	afs = require('./fs'),
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	cache;

/**
 * Detects if Java and the JDK are installed.
 * @param {Object} [config] - The CLI configuration
 * @param {Object} [opts] - Detection options; currently only 'bypassCache'
 * @param {Function} finished - A function to call with the result
 * @example
 * require('./lib/jdk').detect(function (r) { console.log(r); });
 */
exports.detect = function detect(config, opts, finished) {
	if (typeof config == 'function') {
		// 1 arg (function)
		finished = config;
		config = {};
		opts = {};
	} else if (typeof opts == 'function') {
		// 2 args (object, function)
		finished = opts;
		opts = {};
	} else {
		opts || (opts = {});
	}

	if (cache && !opts.bypassCache) return finished(cache);

	var exe = process.platform == 'win32' ? '.exe' : '',
		javaHome = (config.get ? config.get('java.home', process.env.JAVA_HOME) : (config.java && config.java.home || process.env.JAVA_HOME)) || null,
		result = cache = {
			version: null,
			build: null,
			home: null,
			executables: {},
			issues: []
		};

	// sanity check the java home
	if (javaHome) {
		javaHome = afs.resolvePath(javaHome);
		if (!fs.existsSync(javaHome)) {
			javaHome = null;
		}
	}
	result.home = javaHome;

	if (process.platform == 'darwin') {
		// since mac os x 10.7 (lion), java is not installed by default, so
		// we need to manually check
		run('/usr/libexec/java_home', function (err, stdout, stderr) {
			if (err) {
				result.issues.push({
					id: 'JDK_NOT_INSTALLED',
					type: 'error',
					message: __('Java Development Kit not installed.') + '\n'
						+ __('Mac OS X 10.7 (Lion) and newer do not include the JDK and must be manually downloaded and installed from %s.',
						'__http://appcelerator.com/jdk__')
				});
				finished(result);
			} else {
				checkCommands(stdout.trim());
			}
		});
	} else {
		checkCommands();
	}

	function checkCommands(additionalJavaHome) {
		var tasks = {};

		['java', 'javac', 'keytool', 'jarsigner'].forEach(function (cmd) {
			tasks[cmd] = function (next) {
				var paths = [];
				config && config.get && paths.push(config.get('java.executables.' + cmd));
				javaHome && paths.push(path.join(javaHome, 'bin', cmd + exe));
				additionalJavaHome && paths.push(path.join(additionalJavaHome, 'bin', cmd + exe));
				paths.push(cmd + exe);
				findExecutable(paths, function (err, r) {
					next(null, !err && r ? r : null);
				});
			};
		});

		async.parallel(tasks, function (err, executables) {
			result.executables = executables;

			// get the real path
			Object.keys(executables).forEach(function (name) {
				executables[name] && (executables[name] = fs.realpathSync(executables[name]));
			});

			if (Object.keys(tasks).every(function (cmd) { return !executables[cmd]; })) {
				// all commands are null, so no jdk found, check if we already discovered this
				if (!result.issues.some(function (i) { return i.id == 'JDK_NOT_INSTALLED'; })) {
					result.issues.push({
						id: 'JDK_NOT_INSTALLED',
						type: 'error',
						message: __('JDK (Java Development Kit) not installed.') + '\n'
							+ __('If you already have installed the JDK, verify your __JAVA_HOME__ environment variable is correctly set.') + '\n'
							+ __('The JDK is required for must be manually downloaded and installed from %s.',
								'__http://appcelerator.com/jdk__')
					});
				}
			} else {
				// check if any command was missing
				var missing = Object.keys(tasks).filter(function (cmd) { return !executables[cmd]; });
				if (missing.length) {
					result.issues.push({
						id: 'JDK_MISSING_PROGRAMS',
						type: 'error',
						message: __("Unable to find JDK (Java Development Kit) programs: %s", '__' + missing.join(', ') + '__') + '\n'
							+ (process.env.JAVA_HOME
								? __('Please verify your __JAVA_HOME__ environment variable is correctly set to the JDK install location.') + '\n' +
								  __('__JAVA_HOME__ is currently set to "%s".', process.env.JAVA_HOME) + '\n'
								: __('Please set the __JAVA_HOME__ is set to the JDK install location and not the JRE (Java Runtime Environment).') + '\n'
							)
							+ __('The __JAVA_HOME__ must point to the JDK and not the JRE (Java Runtime Environment).') + '\n'
							+ __('You may want to reinstall the JDK by downloading it from %s.',
								'__http://appcelerator.com/jdk__')
					});
				}
			}

			// determine the java home
			if (executables.java || executables.javac) {
				result.home = path.dirname(path.dirname(executables.javac || executables.java));

				// check that we can find the libjvm.so
				if (process.platform == 'linux') {
					var libjvmLocations = process.arch == 'x64' ? [
						'lib/amd64/client/libjvm.so',
						'lib/amd64/server/libjvm.so',
						'jre/lib/amd64/client/libjvm.so',
						'jre/lib/amd64/server/libjvm.so'
					] : [
						'lib/i386/client/libjvm.so',
						'lib/i386/server/libjvm.so',
						'jre/lib/i386/client/libjvm.so',
						'jre/lib/i386/server/libjvm.so'
					];

					if (!libjvmLocations.some(function (file) {
						return fs.existsSync(path.join(result.home, file));
					})) {
						result.issues.push({
							id: 'JDK_INVALID_JAVA_HOME',
							type: 'error',
							message: __('Unable to find a valid Java installation containing a libjvm.so') + '\n'
								+ (process.env.JAVA_HOME
									? __('Please verify your __JAVA_HOME__ environment variable is correctly set to the JDK install location.') + '\n' +
									  __('__JAVA_HOME__ is currently set to "%s".', process.env.JAVA_HOME) + '\n'
									: __('Please set the __JAVA_HOME__ is set to the JDK install location and not the JRE (Java Runtime Environment).') + '\n'
								)
								+ __('The __JAVA_HOME__ must point to the JDK and not the JRE (Java Runtime Environment).') + '\n'
								+ __('You may want to reinstall the JDK by downloading it from %s.',
									'__http://appcelerator.com/jdk__')
						});
					}
				}
			}

			// if we have javac, then at least we can get the version and guess the java home path
			if (executables.javac) {
				// try the 64-bit version first
				run(executables.javac, ['-version', '-d64'], function (err, stdout, stderr) {
					if (!err) {
						// 64-bit version
						var m = stderr.match(/javac (.+)_(.+)/);
						if (m) {
							result.version = m[1];
							result.build = m[2];
							result.architecture = '64bit';
						}
						return finished(result);
					}

					// try the 32-bit version
					run(executables.javac, '-version', function (err, stdout, stderr) {
						var m = stderr.match(/javac (.+)_(.+)/);
						if (m) {
							result.version = m[1];
							result.build = m[2];
							result.architecture = '32bit';
						}
						finished(result);
					});
				});
			} else {
				finished(result);
			}
		});
	}
};
