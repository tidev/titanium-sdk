/**
 * Detects if Java and the JDK are installed.
 *
 * @module jdk
 *
 * @copyright
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
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
	if (typeof config === 'function') {
		// 1 arg (function)
		finished = config;
		config = {};
		opts = {};
	} else if (typeof opts === 'function') {
		// 2 args (object, function)
		finished = opts;
		opts = {};
	} else {
		opts || (opts = {});
	}

	if (cache && !opts.bypassCache) return finished(cache);

	var exe = process.platform === 'win32' ? '.exe' : '',
		javaHome = (config.get ? config.get('java.home', process.env.JAVA_HOME) : (config.java && config.java.home || process.env.JAVA_HOME)) || null,
		jdkPaths = [],
		requiredTools = ['java', 'javac', 'keytool', 'jarsigner'],
		executables = {},
		results = {
			jdks: {},
			home: null,
			version: null,
			build: null,
			executables: executables,
			issues: []
		};

	function isJDK(dir) {
		if (fs.existsSync(path.join(dir, 'bin', 'javac' + exe)) && fs.existsSync(path.join(dir, 'lib', 'dt.jar'))) {
			// try to find the jvm lib
			var libjvmLocations = [];

			if (process.platform === 'linux') {
				if (process.arch === 'x64') {
					libjvmLocations = [
						'lib/amd64/client/libjvm.so',
						'lib/amd64/server/libjvm.so',
						'jre/lib/amd64/client/libjvm.so',
						'jre/lib/amd64/server/libjvm.so'
					];
				} else {
					libjvmLocations = [
						'lib/i386/client/libjvm.so',
						'lib/i386/server/libjvm.so',
						'jre/lib/i386/client/libjvm.so',
						'jre/lib/i386/server/libjvm.so'
					];
				}
			} else if (process.platform === 'darwin') {
				libjvmLocations = [
					'jre/lib/server/libjvm.dylib',
					'../Libraries/libjvm.dylib'
				];
			} else if (process.platform === 'win32') {
				libjvmLocations = [
					'jre/bin/server/jvm.dll',
					'jre/bin/client/jvm.dll'
				];
			}

			return libjvmLocations.some(function (p) {
				return fs.existsSync(path.resolve(dir, p));
			});
		}
	}

	// sanity check the java home
	if (javaHome) {
		javaHome = afs.resolvePath(javaHome);
		if (fs.existsSync(javaHome)) {
			isJDK(javaHome) && jdkPaths.push(javaHome);
		} else {
			javaHome = null;
		}
	}
	results.home = javaHome;

	async.series([
		function detectLinux(next) {
			if (process.platform !== 'linux') return next();

			findExecutable('javac', function (err, p) {
				if (!err && p) {
					p = path.dirname(path.dirname(p));
					jdkPaths.indexOf(p) === -1 && isJDK(p) && jdkPaths.push(p);
				}
				next();
			});
		},
		function detectOSX(next) {
			if (process.platform !== 'darwin') return next();

			run('/usr/libexec/java_home', function (err, stdout, stderr) {
				if (!err) {
					var p = stdout.trim();
					p && jdkPaths.indexOf(p) === -1 && isJDK(p) && jdkPaths.push(p);
				}

				findExecutable('javac', function (err, p) {
					if (!err && p) {
						p = fs.realpathSync(path.dirname(path.dirname(p)));
						jdkPaths.indexOf(p) === -1 && isJDK(p) && jdkPaths.push(p);
					}

					['/Library/Java/JavaVirtualMachines', '/System/Library/Java/JavaVirtualMachines'].forEach(function (parent) {
						fs.existsSync(parent) && fs.readdirSync(parent).forEach(function (name) {
							var p = path.join(parent, name, 'Contents', 'Home');
							jdkPaths.indexOf(p) === -1 && isJDK(p) && jdkPaths.push(p);
						});
					});

					next();
				});
			});
		},
		function detectWin(next) {
			if (process.platform !== 'win32') return next();

			['%SystemDrive%', '%ProgramFiles%', '%ProgramFiles(x86)%', '%ProgramW6432%', '~'].forEach(function (dir) {
				dir = afs.resolvePath(dir);
				fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
					var subdir = path.join(dir, name);
					isJDK(subdir) && jdkPaths.indexOf(subdir) === -1 && jdkPaths.push(subdir);
				});
			});

			next();
		}
	], function () {
		async.parallel(jdkPaths.map(function (home) {
			return function (next) {
				var jdkInfo = {
						home: home,
						version: null,
						build: null,
						executables: {}
					},
					missingTools = [];

				requiredTools.forEach(function (cmd) {
				    var p = path.join(home, 'bin', cmd + exe);
					if (fs.existsSync(p)) {
						jdkInfo.executables[cmd] = fs.realpathSync(p);
					} else {
						missingTools.push(cmd);
					}
				});

				if (missingTools.length) {
					results.issues.push({
						id: 'JDK_MISSING_PROGRAMS',
						type: 'warning',
						message: __('JDK (Java Development Kit) at %s missing required programs: %s', home, '__' + missingTools.join(', ') + '__') + '\n'
							+ (process.env.JAVA_HOME
								? __('Please verify your __JAVA_HOME__ environment variable is correctly set to the JDK install location.') + '\n' +
								  __('__JAVA_HOME__ is currently set to "%s".', process.env.JAVA_HOME) + '\n'
								: __('Please set the __JAVA_HOME__ is set to the JDK install location and not the JRE (Java Runtime Environment).') + '\n'
							)
							+ __('The __JAVA_HOME__ must point to the JDK and not the JRE (Java Runtime Environment).') + '\n'
							+ __('You may want to reinstall the JDK by downloading it from %s.',
								'__http://appcelerator.com/jdk__')
					});
					return next();
				}

				function finalize(str, arch) {
					var m = str !== null && str.match(/javac (.+)_(.+)/);
					if (m) {
						jdkInfo.version = m[1];
						jdkInfo.build = m[2];
						jdkInfo.architecture = arch;
						next(null, jdkInfo);
					} else {
						next();
					}
				}

				// get the version
				// try the 64-bit version first
				run(jdkInfo.executables.javac, ['-version', '-d64'], function (code, stdout, stderr) {
					if (!code) {
						// 64-bit version
						return finalize(stderr, '64bit');
					}

					// try the 32-bit version
					run(jdkInfo.executables.javac, '-version', function (code, stdout, stderr) {
						finalize(code ? null : stderr, '32bit');
					});
				});
			};
		}), function (err, jdks) {
			if (jdks.length) {
				jdks.forEach(function (jdk) {
					results.jdks[jdk.version + '_' + jdk.build] = jdk;

					// only add the first jdk as it's probably the JAVA_HOME based one
					if (results.version === null) {
						mix(results, jdk);
					}
				});
			} else {
				results.issues.push({
					id: 'JDK_NOT_INSTALLED',
					type: 'error',
					message: __('JDK (Java Development Kit) not installed.') + '\n'
						+ __('If you already have installed the JDK, verify your __JAVA_HOME__ environment variable is correctly set.') + '\n'
						+ __('The JDK is required for must be manually downloaded and installed from %s.',
							'__http://appcelerator.com/jdk__')
				});
			}

			finished(cache = results);
		});
	});
};
