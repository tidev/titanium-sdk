/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
const isAndroid = Ti.Platform.osname === 'android';
const isIOS = !isAndroid && (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad');
const isIOS13Plus = isIOS && parseInt(Ti.Platform.version.split('.')[0]) >= 13;

// As Android passes a new instance of Ti.UI to every JS file we can't just
// Ti.UI within this file, we must call kroll.binding to get the Titanium
// namespace that is passed in with require and that deal with the .UI
// namespace that is on that directly.
const UI = isAndroid ? kroll.binding('Titanium').Titanium.UI : Ti.UI;

// Make our read-only constants
Object.defineProperty(UI, 'SEMANTIC_COLOR_TYPE_LIGHT', {
	value: 'light',
	writable: false
});
Object.defineProperty(UI, 'SEMANTIC_COLOR_TYPE_DARK', {
	value: 'dark',
	writable: false
});
Object.defineProperty(UI, 'semanticColorType', {
	get: () => {
		// Assume "light" mode unless we explicitly know it's dark
		if (isIOS13Plus && Ti.App.iOS.userInterfaceStyle === Ti.App.iOS.USER_INTERFACE_STYLE_DARK) {
			return UI.SEMANTIC_COLOR_TYPE_DARK;
		}
		// TODO: Make this work on Android too!
		return UI.SEMANTIC_COLOR_TYPE_LIGHT;
	}
});

let colorset;
UI.fetchSemanticColor = function fetchSemanticColor (colorName) {
	if (isIOS13Plus) {
		return Ti.UI.iOS.fetchSemanticColor(colorName);
	}

	if (!colorset) {
		try {
			const colorsetFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'semantic.colors.json');
			if (colorsetFile.exists()) {
				colorset = JSON.parse(colorsetFile.read().text);
			}
		} catch (error) {
			// We should probably throw an Error here (or return a fallback color!)
			console.error('Failed to load colors file \'semantic.colors.json\'');
			return;
		}
	}

	// TODO: Make a "fake" TiColor object here that wraps the hex value (so that both platforms return a Ti.UI.Color-like object?)
	try {
		return colorset[colorName][UI.semanticColorType].color || colorset[colorName][UI.semanticColorType];
	} catch (error) {
		console.error(`Failed to lookup color for ${colorName}`);
	}
};
