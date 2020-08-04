/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-disable quote-props */
/* globals OS_ANDROID, OS_IOS */

// Add global constants.
Object.defineProperties(global, {
	'OS_ANDROID': { value: OS_ANDROID, writable: false },
	'OS_IOS': { value: OS_IOS, writable: false },
	OS_VERSION_MAJOR: { value: Ti.Platform.versionMajor, writable: false },
	OS_VERSION_MINOR: { value: Ti.Platform.versionMinor, writable: false }
});
