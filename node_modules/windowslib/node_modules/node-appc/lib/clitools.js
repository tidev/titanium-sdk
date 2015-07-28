/**
 * Detects the Mac OS X Command Line Tools.
 *
 * @module clitools
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var __ = require('./i18n')(__dirname).__,
	async = require('async'),
	os = require('os'),
	path = require('path'),
	version = require('./version'),
	sp = require('./subprocess'),
	run = sp.run,
	findExecutable = sp.findExecutable,
	cache;

/**
 * Detects if the Command Line Tools are installed.
 * @param {Object} [config] - The CLI config object
 * @param {Function} finished - The callback to fire when the detection is complete
 */
exports.detect = function detect(config, finished) {
	var results = {
		installed: null,
		issues: []
	};

	if (typeof config == 'function') {
		finished = config;
		config = null;
	}

	if (process.platform != 'darwin') return finished(results);
	if (cache) return finished(cache);

	function finalize(installed) {
		results.installed = installed;
		cache = results;

		if (!installed) {
			results.issues.push({
				id: 'OSX_CLI_TOOLS_NOT_INSTALLED',
				type: 'warning',
				message: __('The Command Line Tools are not installed') + '\n'
					+ __('Titanium requires that the Command Line Tools be installed to develop __Tizen apps__ or __native Android modules__.') + '\n'
					+ __('You can install them from the Xcode Preferences > Downloads tab or by visiting') + '\n'
					+ '__https://developer.apple.com/downloads/index.action?=command%%20line%%20tools__.'
			});
		}

		finished(results);
	}

	var ignore = /^which|xcode\-select$/,
		executables = [
			[config && config.get('osx.executables.xcodeSelect'), 'xcode-select'],
			[config && config.get('osx.executables.which'), 'which'],
			[config && config.get('osx.executables.make'), 'make'],
			[config && config.get('osx.executables.gperf'), 'gperf']
		],
		tasks = {};

	executables.forEach(function (exe) {
		tasks[exe[1]] = function (next) {
			findExecutable(exe, next);
		};
	});

	async.series(tasks, function (err, bins) {
		// if we're running Mountain Lion or older, the tools be easy to find in /usr/bin
		if (version.lt(os.release(), '13.0.0')) {
			return finalize(!err);
		}

		// we're Mavericks or newer, so we need to make sure they are real

		var tasks = {};
		executables.forEach(function (exe) {
			exe = exe[1];
			if (!ignore.test(exe)) {
				tasks[exe] = function (next) {
					run(bins.which, '/Library/Developer/CommandLineTools/usr/bin/' + exe, next);
				};
			}
		});

		async.series(tasks, function (err) {
			if (!err) {
				return finalize(true);
			}

			// didn't find all the apps we need in /Library/Developer/CommandLineTools, see if Xcode is installed
			run(bins['xcode-select'], '--print-path', function (code, out, err) {
				if (code) {
					// xcode is not installed
					return finalize(false);
				}

				var xcodeDir = out.trim(),
					tasks = {};
				executables.forEach(function (exe) {
					exe = exe[1];
					if (!ignore.test(exe)) {
						tasks[exe] = function (next) {
							// try /path/to/Xcode/Contents/Developer/usr/bin
							run(bins.which, path.join(xcodeDir, 'usr', 'bin', exe), function (code) {
								if (!code) {
									return next(null);
								}
								// try /path/to/Xcode/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin
								run(bins.which, path.join(xcodeDir, 'Toolchains', 'XcodeDefault.xctoolchain', 'usr', 'bin', exe), next);
							});
						};
					}
				});

				async.series(tasks, function (err) {
					finalize(!err);
				});
			});
		});
	});
};