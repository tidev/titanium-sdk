/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID,OS_IOS, OS_VERSION_MAJOR */
import Color from '../../../../lib/color';
const isIOS13Plus = OS_IOS && (OS_VERSION_MAJOR >= 13);

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
if (!isIOS13Plus) {
	// On iOS < 13, we don't have the theme constants defined, which breaks our tests
	if (OS_IOS) {
		Object.defineProperty(UI, 'USER_INTERFACE_STYLE_UNSPECIFIED', {
			value: 0,
			writable: false
		});
		Object.defineProperty(UI, 'USER_INTERFACE_STYLE_LIGHT', {
			value: 1,
			writable: false
		});
		Object.defineProperty(UI, 'USER_INTERFACE_STYLE_DARK', {
			value: 2,
			writable: false
		});
		// Treat iOS < 13 as 'light' theme
		Object.defineProperty(UI, 'userInterfaceStyle', {
			value: 1,
			writable: false
		});
	}

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
				return Color.fallback().toHex();
			}
		}

		try {
			if (!colorset[colorName]) {
				if (OS_ANDROID) {
					// if it's not in the semantic colors and we're on Android, it may be a Ti.Android.R.color value
					const systemColorId = Ti.Android.R.color[colorName];
					if (systemColorId) {
						const resourceColor = Ti.UI.Android.getColorResource(systemColorId);
						if (resourceColor) {
							return resourceColor.toHex();
						}
					}
				}
				return Color.fallback().toHex();
			}

			const entry = colorset[colorName][UI.semanticColorType];
			const colorObj = Color.fromSemanticColorsEntry(entry);
			// For now, return a string on iOS < 13, Android so we can pass the result directly to the UI property we want to set
			// Otherwise we need to modify the Android APIs to accept fake/real Ti.UI.Color instances and convert it to it's own internal
			// Color representation
			return colorObj.toRGBAString(); // If there's an entry, use the more exact rgba function over 8-char ARGB hex. Hard to convert things like 75% alpha properly.
		} catch (error) {
			console.error(`Failed to lookup color for ${colorName}`);
		}
		return Color.fallback().toHex();
	};
}
