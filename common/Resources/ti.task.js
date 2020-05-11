/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This script is loaded on background task startup on all platforms. It is used to load
 * JS polyfills and Titanium's core JavaScript extensions shared by all platforms.
 */

// Load JS language polyfills
import 'core-js/es';
// Load polyfill for async/await usage
import 'regenerator-runtime/runtime';
// import all of our polyfills/extensions
import './ti.internal/extensions';
