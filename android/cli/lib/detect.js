/**
 * Detects the Android development environment and its dependencies.
 *
 * @module lib/detect
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { detect } from 'node-titanium-sdk/lib/android.js';
import ADB from 'node-titanium-sdk/lib/adb.js';
import EmulatorManager from 'node-titanium-sdk/lib/emulator.js';

/**
 * Detects current Android environment.
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Object} opts - Detection options; currently only 'bypassCache'
 * @param {Function} finished - Callback when detection is finished
 */
export { detect };

/**
 * Detects connected Android emulators.
 * @param {Object} config - The CLI config object
 * @param {Object} [opts] - Detection options
 * @param {String} [opts.type] - The type of emulator to load (avd, genymotion); defaults to all
 * @param {Function} finished - Callback when detection is finished
 */
export function detectEmulators(config, opts, finished) {
	if (opts && typeof opts === 'function') {
		finished = opts;
		opts = {};
	}

	new EmulatorManager(config).detect(opts, function (err, emus) {
		if (err) {
			finished(err);
		} else {
			finished(null, emus);
		}
	});
}

/**
 * Detects connected Android devices.
 * @param {Object} config - The CLI config object
 * @param {Function} finished - Callback when detection is finished
 */
export function detectDevices(config, finished) {
	new ADB(config).devices(function (err, devices) {
		if (err) {
			return finished(err);
		}

		finished(null, devices.filter(function (d) {
			return !d.emulator;
		}).map(function (d) {
			d.name = d.model || d.manufacturer || d.name || (d.release ? `Android ${d.release} Device` : 'Android Device');
			return d;
		}));
	});
}
