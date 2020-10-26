/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * This script is used to load ACA (Axway Crash Analytics).
 * This allows ACA to be the first module to load on startup.
 */

try {
	import('com.appcelerator.aca');
} catch (e) {
	// Could not load module, silently ignore exception.
}
