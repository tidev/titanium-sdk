/**
 * Detects the Android development environment and its dependencies.
 *
 * @module lib/detect
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var android = require('titanium-sdk/lib/android'),
	ADB = require('titanium-sdk/lib/adb'),
	EmulatorManager = require('titanium-sdk/lib/emulator');

/**
 * Detects current Android environment.
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Object} opts - Detection options; currently only 'bypassCache'
 * @param {Function} finished - Callback when detection is finished
 */
exports.detect = android.detect;

/**
 * Detects connected Android emulators.
 * @param {Object} config - The CLI config object
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} finished - Callback when detection is finished
 */
exports.detectEmulators = function detectEmulators(config, opts, finished) {
	if (opts && typeof opts == 'function') {
		finished = opts;
		opts = {};
	}

	new EmulatorManager(config).detect(opts, finished);
};

/**
 * Detects connected Android devices.
 * @param {Object} config - The CLI config object
 * @param {Function} finished - Callback when detection is finished
 */
exports.detectDevices = function detectDevices(config, finished) {
	new ADB(config).devices(function (err, devices) {
		finished(null, devices.filter(function (d) { return !d.emulator }));
	});
};
