/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID,OS_IOS */
import Color from '../../../../lib/color';
const isIOS13Plus = OS_IOS && parseInt(Ti.Platform.version.split('.')[0]) >= 13;
const isMACOSX15Plus = Ti.Platform.name === 'Mac OS X' && parseInt(Ti.Platform.version.split('.')[1]) >= 15;

// As Android passes a new instance of Ti.UI to every JS file we can't just
// Ti.UI within this file, we must call kroll.binding to get the Titanium
// namespace that is passed in with require and that deal with the .UI
// namespace that is on that directly.
const UI = OS_ANDROID ? kroll.binding('Titanium').Titanium.UI : Ti.UI;

// Make our read-only constants
// TODO: Remove in SDK 10, DEPRECATED in 9.1.0
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
		// TODO: Guard against ios < 13 and Android api < 29?
		// Assume "light" mode unless we explicitly know it's dark
		if (Ti.UI.userInterfaceStyle === Ti.UI.USER_INTERFACE_STYLE_DARK) {
			return UI.SEMANTIC_COLOR_TYPE_DARK;
		}
		return UI.SEMANTIC_COLOR_TYPE_LIGHT;
	}
});

// on Android/iOS < 13, we need to roll our own fetchSemanticColor impl
// on iOS 13+, we have a native version
if (!isIOS13Plus && !isMACOSX15Plus) {
	let colorset;
	UI.fetchSemanticColor = function fetchSemanticColor (colorName) {
		if (!colorset) {
			try {
				const colorsetFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'semantic.colors.json');
				if (colorsetFile.exists()) {
					colorset = JSON.parse(colorsetFile.read().text);
				}
			} catch (error) {
				// We should probably throw an Error here (or return a fallback color!)
				console.error('Failed to load colors file \'semantic.colors.json\'');
				return Color.fallback().toRGBAString();
			}
		}

		try {
			if (!colorset[colorName]) {
				return Color.fallback().toRGBAString();
			}

			const entry = colorset[colorName][UI.semanticColorType];
			const colorObj = Color.fromSemanticColorsEntry(entry);
			// For now, return a string on iOS < 13, Android so we can pass the result directly to the UI property we want to set
			// Otherwise we need to modify the Android APIs to accept this faked Ti.UI.Color instance and convert it to it's own internal
			// Color representation
			return colorObj.toRGBAString(); // rgba is standard across iOS/Android. Hex on Android ia ARGB vs RGBA on iOS.
		} catch (error) {
			console.error(`Failed to lookup color for ${colorName}`);
		}
		return Color.fallback().toRGBAString();
	};
}
