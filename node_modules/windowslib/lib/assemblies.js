/**
 * Detects if specific assemblies are installed.
 *
 * @module assemblies
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	fs = require('fs'),
	magik = require('./utilities').magik,
	path = require('path'),
	__ = appc.i18n(__dirname).__;

var cache;

exports.detect = detect;

/**
 * Detects if specific assemblies are installed.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects installed required assemblies.
 * @param {String} [options.assemblyPath=%WINDIR%\Microsoft.NET\assembly\GAC_MSIL] - Path to .NET global assembly cache.
 * @param {Object} [options.requiredAssemblies] - An object containing assemblies to check for in addition to the required windowslib dependencies.
 * @param {Function} [callback(err, results)] - A function to call with the assembly information.
 *
 * @emits module:assemblies#detected
 * @emits module:assemblies#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		var requiredAssemblies = {
				'Microsoft.SmartDevice.Connectivity.Interface': '>=10', // min version 10
				'Microsoft.SmartDevice.MultiTargeting.Connectivity': '>=10' // min version 10
			},
			results = cache = {
				assemblies: {},
				issues: []
			},
			assemblyPath = appc.fs.resolvePath(options.assemblyPath || '%WINDIR%\\Microsoft.NET\\assembly\\GAC_MSIL');

		Object.keys(requiredAssemblies).forEach(function (assembly) {
			results.assemblies[assembly] = null;
		});

		if (options.requiredAssemblies !== null && typeof options.requiredAssemblies === 'object') {
			Object.keys(options.requiredAssemblies).forEach(function (assembly) {
				requiredAssemblies[assembly] = options.requiredAssemblies[assembly];
				results.assemblies[assembly] = null;
			});
		}

		if (!fs.existsSync(assemblyPath)) {
			results.issues.push({
				id: 'WINDOWS_GAC_PATH_DOES_NOT_EXIST',
				type: 'error',
				message: __('The Microsoft.NET global assembly cache path "%s" does not exist.', assemblyPath)
			});

			process.nextTick(function () {
				emitter.emit('detected', cache);
				callback(null, cache);
			});
		} else {
			// example value: "v4.0_11.0.1__b03f5f7f11d50a3a"
			var assemblyVersionRegExp = /^v?((?:(?:\d\.)?\d\.)?\d)_((?:(?:(?:\d+\.)?\d+\.)?\d+\.)?\d+).*_+(.*)$/,
				missingAssemblies = [];

			Object.keys(requiredAssemblies).forEach(function (assembly) {
				var dir = path.join(assemblyPath, assembly);
				if (fs.existsSync(dir))
				{
					fs.readdirSync(dir).forEach(function (name) {
						var m = name.match(assemblyVersionRegExp),
							file = m && path.join(dir, name, assembly + '.dll');

						if (m && m[2] && (!requiredAssemblies[assembly] || appc.version.satisfies(m[2], requiredAssemblies[assembly]), true) && fs.existsSync(file)) {
							results.assemblies[assembly] || (results.assemblies[assembly] = {});
							results.assemblies[assembly][m[2]] = {
								assemblyFile: file,
								dotNetVersion: m[1],
								assemblyVersion: m[2],
								publicKeyToken: m[3]
							};
						}
					});
				}

				if (!results.assemblies[assembly]) {
					missingAssemblies.push(assembly);
				}
			});

			if (missingAssemblies.length) {
				results.issues.push({
					id: 'WINDOWS_MISSING_REQUIRED_ASSEMBLIES',
					type: 'error',
					message: __('Unable to find the following required Microsoft.NET assemblies: %s.', '"' + missingAssemblies.join('", "') + '"') + '\n' +
						__('These should be resolved by reinstalling Microsoft Visual Studio.')
				});
			}

			emitter.emit('detected', results);
			callback(null, results);
		}
	});
};
