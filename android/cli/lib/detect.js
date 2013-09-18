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

var android = require('titanium-sdk/lib/android')

/**
 * Detects current Android environment.
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Object} opts - Detection options; currently only 'bypassCache'
 * @param {Function} finished - Callback when detection is finished
 */
exports.detect = android.detect;
