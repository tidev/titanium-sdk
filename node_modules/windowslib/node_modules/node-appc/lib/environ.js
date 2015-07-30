/**
 * Detects the Titanium environment including SDKs installed and operating
 * system info.
 *
 * @module environ
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var fs = require('fs'),
	path = require('path'),
	async = require('async'),
	exec = require('child_process').exec,
	afs = require('./fs'),

	OSs = {
		darwin: {
			name: 'osx',
			sdkPaths: [
				'~/Library/Application Support/Titanium', // Lion
				'/Library/Application Support/Titanium' // pre-Lion
			]
		},
		win32: {
			name: 'win32',
			sdkPaths: [
				'%ProgramData%\\Titanium', // Windows Vista, Windows 7
				'%APPDATA%\\Titanium', // Windows XP, Windows Server 2003
				'%ALLUSERSPROFILE%\\Application Data\\Titanium' // Windows XP, Windows Server 2003
			]
		},
		linux: {
			name: 'linux',
			sdkPaths: [
				'~/.titanium'
			]
		}
	},
	os = OSs[process.platform],
	osInfo,

	readme = /readme.*/i,
	jsfile = /\.js$/,
	ignore = /\.?_.*| |\.DS_Store/,

	env = module.exports = {
		// list of all sdks found
		sdks: {},

		os: os,

		// deprecated
		commands: {}, // map of commands to path of file to require
		project: {
			commands: {} // project-based commands
		},
	},

	// object to track paths that we've already scanned
	scannedSdkPaths = {},
	scannedCommandPaths = {};

/**
 * Scans a path for commands. This logic has been moved to the Titanium CLI,
 * but must remain here for older Titanium CLI versions.
 * @param {Object} dest - The destination of the results
 * @param {String} commandsPath - The path to scan for commands
 * @deprecated
 */
module.exports.scanCommands = function scanCommands(dest, commandsPath) {
	if (!scannedCommandPaths[commandsPath] && fs.existsSync(commandsPath)) {
		// if the path is a js file, then we allow it no matter what
		if (fs.statSync(commandsPath).isFile() && jsfile.test(f)) {
			var name = commandsPath.replace(jsfile, '').toLowerCase();
			dest[name] || (dest[name] = commandsPath);
		} else {
			fs.readdirSync(commandsPath).forEach(function (file) {
				var fullPath = path.join(commandsPath, file);
				// we don't allow commands that start with _ or have spaces
				if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile() && jsfile.test(fullPath) && !ignore.test(path.basename(fullPath))) {
					// we don't allow commands that start with _ or have spaces
					var name = fullPath.replace(jsfile, '');
					dest[name] || (dest[name] = fullPath);
				}
			});
		}
		scannedCommandPaths[commandsPath] = 1;
	}
};

/**
 * Returns the specified Titanium SDK info or null if not found.
 * @param {String} version - A Titanium SDK version or 'latest'
 * @returns {Object} The Titanium SDK info or null
 */
module.exports.getSDK = function getSDK(version) {
	if (!version || version == 'latest') {
		version = Object.keys(env.sdks).sort().pop();
	}
	return env.sdks[version] || null;
};

/**
 * Detects installed Titanium SDKs.
 * @param {String|Array<String>} paths - An array of paths to scan for Titanium SDKs
 */
module.exports.detectTitaniumSDKs = module.exports.detect = function detectTitaniumSDKs(paths) {
	var sdkPaths = [].concat(os.sdkPaths);
	Array.isArray(paths) && (sdkPaths = sdkPaths.concat(paths));
	sdkPaths.forEach(function (titaniumPath) {
		titaniumPath = afs.resolvePath(titaniumPath);

		!env.installPath && fs.existsSync(path.dirname(titaniumPath)) && (env.installPath = titaniumPath);

		if (fs.existsSync(titaniumPath)) {
			// we can only call realpathSync if the file exists
			titaniumPath = fs.realpathSync(titaniumPath);

			if (scannedSdkPaths[titaniumPath]) return;
			scannedSdkPaths[titaniumPath] = 1;

			var mobilesdkPath = path.join(titaniumPath, 'mobilesdk', os.name);
			if (fs.existsSync(mobilesdkPath)) {
				fs.readdirSync(mobilesdkPath).filter(function (f) {
					var dir = path.join(mobilesdkPath, f);
					return fs.existsSync(dir) && fs.statSync(dir).isDirectory() && fs.readdirSync(dir).some(function (f) {
						return fs.existsSync(path.join(dir, f)) && readme.test(f);
					});
				}).filter(function (f) {
					for (var i = 0; i < env.sdks.length; i++) {
						if (env.sdks[i].version == f) {
							return false;
						}
					}
					return true;
				}).sort(function (a, b) {
					if (a === b) return 0;
					if (a < b) return 1;
					return -1;
				}).map(function (v) {
					var sdkPath = path.join(mobilesdkPath, v),
						manifestFile = path.join(sdkPath, 'manifest.json'),
						manifest,
						platforms = ['android', 'ios', 'mobileweb'],
						sdk = env.sdks[v] = {
							commands: {},
							name: v,
							path: sdkPath,
							platforms: {}
						};

					if (fs.existsSync(manifestFile)) {
						// read in the manifest
						try {
							manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
							manifest && (sdk.manifest = manifest);
						} catch (e) {}
					}

					platforms = manifest ? manifest.platforms : platforms;
					platforms.forEach(function (p) {
						var pp = path.join(sdkPath, p);
						if (fs.existsSync(pp)) {
							sdk.platforms[p] = {
								path: pp,
								commands: {}
							};
						} else if (p == 'ios' && fs.existsSync(pp = path.join(sdkPath, 'iphone'))) {
							// maybe we have an old Titanium SDK
							sdk.platforms[p] = {
								path: pp,
								commands: {}
							};
						}
					});
				});
			}
		}
	});
};

/**
 * Fetches OS and Node.js info.
 * @param {Function} callback - The function to call when done
 */
module.exports.getOSInfo = function getOSInfo(callback) {
	if (osInfo) {
		callback(osInfo);
		return;
	}

	var _os = require('os');

	// do NOT change the names of these keys... they are specifically used by analytics
	osInfo = {
		os: '',
		platform: process.platform.replace(/darwin/, 'osx'),
		osver: '',
		ostype: (/64/.test(process.arch) ? 64 : 32) + 'bit',
		oscpu: _os.cpus().length,
		memory: _os.totalmem(),
		node: process.version.replace(/^v/, ''),
		npm: ''
	};

	async.series([
		function (next) {
			switch (process.platform) {
				case 'darwin':
					exec('sw_vers', function (err, stdout, stderr) {
						if (!err) {
							var m = stdout.match(/ProductName:\s+(.+)/i),
								m2 = stdout.match(/ProductVersion:\s+(.+)/i);
							m && (osInfo.os = m[1]);
							m2 && (osInfo.osver = m2[1]);
						}
						next();
					});
					break;

				case 'linux':
					if (fs.existsSync('/etc/lsb-release')) {
						var s = fs.readFileSync('/etc/lsb-release').toString(),
							m = s.match(/DISTRIB_DESCRIPTION=(.+)/i),
							m2 = s.match(/DISTRIB_RELEASE=(.+)/i);
						m && (osInfo.os = m[1].replace(/"/g, ''));
						m2 && (osInfo.osver = m2[1].replace(/"/g, ''));
					} else if (fs.existsSync('/etc/system-release')) {
						var s = fs.readFileSync('/etc/system-release').toString().split(' ');
						s.length && (osInfo.os = s[0]);
						s.length > 2 && (osInfo.osver = s[2]);
					}
					osInfo.os || (osInfo.os = 'GNU/Linux');
					next();
					break;

				case 'win32':
					exec('wmic os get Caption,Version', function (err, stdout, stderr) {
						if (!err) {
							var s = stdout.split('\n')[1].split(/ {2,}/);
							s.length > 0 && (osInfo.os = s[0].trim());
							s.length > 1 && (osInfo.osver = s[1].trim());
						}
						next();
					}).stdin.end();
					break;
			}
		}
	], function () {
		exec('npm --version', function (err, stdout, stderr) {
			if (!err) {
				osInfo.npm = stdout.trim();
			}
			callback(osInfo);
		});
	});
};
