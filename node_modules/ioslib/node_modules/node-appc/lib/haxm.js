/**
 * Detects if the Intel Hardware Accelerated Execution Manager (HAXM) is installed.
 *
 * @module haxm
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var run = require('./subprocess').run,
	fs = require('fs'),
	afs = require('./fs'),
	path = require('path'),
	os = require('os'),
	cache;

/**
 * Detects if HAXM is installed.
 * @param {Object} [config] - The CLI configuration
 * @param {Object} [opts] - Detection options; currently only 'bypassCache'
 * @param {Function} finished - A function to call with the result
 * @example
 * require('./lib/haxm').detect(function (r) { console.log(r); });
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

	var result = cache = {
		compatible: /intel/i.test(os.cpus().shift().model),
		installed: false,
		memlimit: null
	};

	switch (process.platform) {
		case 'darwin':
			var plistPath = (config && config.get && config.get('haxm.plist')) || '/Library/Preferences/com.intel.kext.haxm.plist';

			result.installed = fs.existsSync(plistPath);
			if (result.installed) {
				result.memlimit = parseInt(fs.readFileSync(plistPath).toString().split('\n').shift());
			}

			finished(result);
			break;

		case 'linux':
			// need to detect if kvm is installed
			// http://software.intel.com/en-us/blogs/2012/03/12/how-to-start-intel-hardware-assisted-virtualization-hypervisor-on-linux-to-speed-up-intel-android-x86-gingerbread-emulator
			finished(result);
			break;

		case 'win32':
			result.installed = fs.existsSync(afs.resolvePath('%SystemRoot%\\System32\\Drivers\\IntelHaxm.sys'));
			if (result.installed) {
				run('reg', ['query', 'HKLM\\Software\\haxm\\haxm', '/v', 'MemLimit'], function (err, stdout, stderr) {
					if (!err) {
						var m = stdout.match(/MemLimit\s+REG_DWORD\s+(.+)/m);
						if (m) {
							result.memlimit = parseInt(m[1], 16);
						}
					}
					finished(result);
				});
			} else {
				finished(result);
			}
	}
};
