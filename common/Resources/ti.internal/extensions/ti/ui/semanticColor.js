/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID,OS_IOS, OS_VERSION_MAJOR, OS_VERSION_MINOR */
import Color from '../../../../../lib/color';
const isIOS13Plus = OS_IOS && (OS_VERSION_MAJOR >= 13);
const isMacOS = Ti.Platform.name === 'Mac OS X';
const isMACOSXCatalinaPlus = isMacOS && (OS_VERSION_MAJOR > 10 || (OS_VERSION_MAJOR === 10 && OS_VERSION_MINOR >= 15));

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
if (!isIOS13Plus && !isMACOSXCatalinaPlus) {
	// On iOS < 13, we don't have the theme constants defined, which breaks our tests
	if (OS_IOS && !isMacOS) {
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
		// Load all semantic colors from JSON if not done already.
		// Do so via require() in case this file was changed while running LiveView.
		if (!colorset) {
			const colorsetFileName = 'semantic.colors.json';
			try {
				const colorsetFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, colorsetFileName);
				if (colorsetFile.exists()) {
					// eslint-disable-next-line security/detect-non-literal-require
					colorset = require(`/${colorsetFileName}`);
				}
			} catch (error) {
				console.error(`Failed to load colors file '${colorsetFileName}'`);
				return Color.fallback().toHex();
			}
		}

		try {
			if (OS_ANDROID) {
				// On Android, use custom string references to be handled by "TiColorHelper.java".
				if (colorset[colorName]) {
					// Add all theme colors to a single string.
					// Example: "ti.semantic.color:dark=<ColorString>;light=<ColorString>"
					const colorArray = [];
					for (const colorType in colorset[colorName]) {
						const colorObj = Color.fromSemanticColorsEntry(colorset[colorName][colorType]);
						colorArray.push(`${colorType}=${colorObj.toRGBAString()}`);
					}
					return 'ti.semantic.color:' + colorArray.join(';');
				} else if (Ti.Android.R.color[colorName]) {
					// We're referencing a native "res" color entry.
					return `@color/${colorName}`;
				}
			} else if (colorset[colorName]) {
				// Return the raw color string value from the "semantic.colors.json".
				// Use the more exact rgba function over 8-char ARGB hex. Hard to convert things like 75% alpha properly.
				const entry = colorset[colorName][UI.semanticColorType];
				const colorObj = Color.fromSemanticColorsEntry(entry);
				return colorObj.toRGBAString();
			}
		} catch (error) {
			console.error(`Failed to lookup color for ${colorName}`);
		}
		return Color.fallback().toHex();
	};
}
