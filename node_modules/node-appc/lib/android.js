/**
 * Detects the Android development environment and its dependencies.
 *
 * This code has been deprecated and is only used to support Titanium SDKs
 * 3.1.X and older. Starting with Titanium SDK 3.2, the Android detection
 * code has been moved to lib/detect.js in the Android platform repo.
 *
 * @module android
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var exec = require('child_process').exec,
	async = require('async'),
	path = require('path'),
	util = require('./util'),
	fs = require('fs'),
	afs = require('./fs'),
	version = require('./version'),
	cached,
	MIN_API_LEVEL = 7;

/**
 * Detects the Android developmeent environment.
 * @param {Function} finished - The callback to fire when the detection is complete
 * @param {String} [sdkPath] - The possible location of the Android SDK
 * @param {String} [ndkPath] - The possible location of the Android NDK
 */
exports.detect = function detect(finished, sdkPath, ndkPath) {
	if (cached) return finished(cached);

	var result = {
		sdkPath: sdkPath = sdkPath || process.env.ANDROID_SDK || '',
		java: {
			version: '',
			build: ''
		},
		ndk: {
			path: ndkPath = ndkPath || process.env.ANDROID_NDK || '',
			version: ''
		},
		targets: {},
		avds: []
	};

	sdkPath && (sdkPath = result.sdkPath = afs.resolvePath(sdkPath));

	if (!sdkPath || !fs.existsSync(sdkPath)) {
		sdkPath = result.sdkPath = findSDK();
	}

	if (!sdkPath) {
		finished && finished();
		return;
	}

	var exe = result.exe = path.join(sdkPath, 'tools', process.platform == 'win32' ? 'android.bat' : 'android');
	if (!fs.existsSync(exe)) {
		finished && finished();
		return;
	}

	if (exe.indexOf(' ') != -1) {
		if (process.platform === 'win32') {
			exe = '"' + exe + '"';
		} else {
			exe = exe.replace(' ', '\\ ');
		}
	}

	async.series([

		function (next) {
			if (result.ndk.path) {
				try {
					result.ndk.version = fs.readFileSync(path.join(result.ndk.path, "RELEASE.TXT")).toString().trim();
				} catch(e) { // Path doesn't exist
					result.ndk.path = '';
				}
			}
			next();
		},

		function (next) {
			exec('javac -version', function (err, stdout, stderr) {
				if (!err) {
					var m = stderr.match(/javac (.+)_(.+)/);
					if (m) {
						result.java.version = m[1];
						result.java.build = m[2];
					}
				}
				next();
			});
		},

		function (next) {
			exec(exe + ' list', {
				cwd: afs.resolvePath('~')
			}, function (err, stdout, stderr) {
				if (!err) {
					var p = stdout.indexOf('Available Android Virtual Devices:'),
						targets = stdout.substring(0, p - 1).split('----------'),
						target,
						line,
						key,
						value,
						match,
						keyValueRegex = /^\s*(.+)\: (.+)$/,
						idRegex = /^id: ([0-9]*) or "(.*)"$/,
						basedOnRegex = /Based on Android ([0-9\.]*) \(API level ([0-9]*)\)$/,
						libraryEntryRegex = /^[ ]*\* (.*) \((.*)\)/,
						manifestNameRegex = /^name=(.*)$/m,
						manifestVendorRegex = /^vendor=(.*)$/m,
						manifestApiRegex = /^api=(.*)$/m,
						manifestRevisionRegex = /^revision=(.*)$/m,
						dest,
						i, j, k,
						targetDirs = [],
						avds = stdout.substring(p).split('---------'),
						avd;

					targets.shift(); // Remove the header

					// Process the targets
					for (i = 0; i < targets.length; i++) {
						target = targets[i].split('\n');
						j = 0;

						// Parse the target
						while (j < target.length) {
							line = target[j];
							if (line) {
								if (match = line.match(idRegex)) {
									dest = result.targets[match[1]] = {
										id: match[2]
									};
								} else if (line === '     Libraries:') {
									dest['libraries'] = {};
									while (match = target[++j].match(libraryEntryRegex)) {
										key = match[1];
										dest['libraries'][key] = {
											jar: match[2],
											description: target[++j].trim()
										};
									}
									--j; // Need to go back one to counteract the now unecessary j++ below
								} else if (match = line.match(keyValueRegex)) {
									if (match) {
										key = match[1].trim().toLowerCase().replace(/ /g, '-');
										value = match[2].trim();
										switch(key) {
											case 'description':
												dest[key] = value;
												match = target[j + 1].match(basedOnRegex);
												if (match) {
													// Parse the "Base on Android x (API x)" immediately following the desc
													j++;
													dest['based-on'] = {
														'android-version': match[1],
														'api-level': match[2]
													};
												}
												break;
											case 'skins':
												dest[key] = value.split(', ').map(function (v) {
													return v.replace('(default)', '').trim();
												});
												break;
											case 'abis':
												dest[key] = value.split(', ');
												break;
											default:
												dest[key] = value;
										}
									}
								}
							}
							j++;
						}
					}

					// Create the list of target directories and their properties
					afs.visitDirsSync(path.join(sdkPath, 'add-ons'), function(subDir, subDirPath) {
						var manifestFile = path.join(subDirPath, 'manifest.ini');
						if (fs.existsSync(manifestFile)) {
							var manifest = fs.readFileSync(manifestFile).toString();
							targetDirs.push({
								dirPath: subDirPath,
								name: manifest.match(manifestNameRegex)[1],
								vendor: manifest.match(manifestVendorRegex)[1],
								api: manifest.match(manifestApiRegex)[1],
								revision: manifest.match(manifestRevisionRegex)[1]
							});
						}
					});

					// Find the paths for the target and remove unsupported android versions
					targets = result.targets;
					Object.keys(targets).forEach(function (dest) {
						if (targets[dest]['type'] === 'Platform') {
							if (parseInt(targets[dest]['api-level']) < MIN_API_LEVEL) {
								delete targets[dest];
							} else {
								targets[dest].path = path.join(sdkPath, 'platforms', targets[dest].id);
							}
						} else if (targets[dest]['type'] === 'Add-On') {
							if (targets[dest]['based-on'] && parseInt(targets[dest]['based-on']['api-level']) < MIN_API_LEVEL) {
								delete targets[dest];
							} else {
								for (j = 0; j < targetDirs.length; j++) {
									if (targetDirs[j].name === targets[dest].name &&
											targetDirs[j].vendor === targets[dest].vendor &&
											targetDirs[j].revision === targets[dest].revision) {
										targets[dest].path = targetDirs[j].dirPath;
										break;
									}
								}
							}
						}
					});

					// now process the avds
					avds[0] = avds[0].substring(avds[0].indexOf('\n')); // Remove the header
					for (i = 0; i < avds.length; i++) {
						avd = avds[i];
						if (avd.charAt(avd.length - 1) === '\n') {
							avd = avd.substring(0, avd.length - 2);
						}
						avd = avd.split('\n');
						if (avd.length > 1 || avd[0]) {
							dest = result.avds[i] = {};
							j = 0;
							while (j < avd.length) {
								line = avd[j];
								if (line && (match = line.match(keyValueRegex))) {
									key = match[1].trim().toLowerCase().replace(' ', '-');
									value = match[2].trim();
									while (avd[++j] && !avd[j].match(keyValueRegex)) {
										if (match = avd[j].match(basedOnRegex)) {
											dest['based-on'] = {
												'android-version': match[1],
												'api-level': match[2]
											}
										} else {
											value += '\n' + avd[j];
										}
									}
									dest[key] = value;
								} else {
									j++;
								}
							}
						}
					}
				}
				next();
			});
		}
	], function () {
		finished(cached = result);
	});
};

function findSDK() {
	var i,
		dirs = process.platform == 'win32'
			? ['C:\\android-sdk', 'C:\\android', 'C:\\Program Files\\android-sdk', 'C:\\Program Files\\android', 'C:\\Program Files\\Android\\android-sdk',
				'C:\\Program Files (x86)\\android-sdk', 'C:\\Program Files (x86)\\android', 'C:\\Program Files (x86)\\Android\\android-sdk']
			: ['/opt/android', '/opt/android-sdk', '/usr/android', '/usr/android-sdk'],
		exe = process.platform == 'win32' ? 'android.exe' : 'android';

	for (i = 0; i < dirs.length; i++) {
		if (fs.existsSync(dirs[i])) {
			return dirs[i];
		}
	}

	dirs = (process.env.PATH || '').split(process.platform == 'win32' ? ';' : ':');
	for (i = 0; i < dirs.length; i++) {
		if (fs.existsSync(dirs[i].trim(), exe)) {
			return dirs[i];
		}
	}
}
