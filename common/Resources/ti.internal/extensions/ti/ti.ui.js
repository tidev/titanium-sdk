/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID,OS_IOS */
const isIOS13Plus = OS_IOS && parseInt(Ti.Platform.version.split('.')[0]) >= 13;

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
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	const fallbackColor = 'black'; // To match iphone/Classes/TiUIiOSProxy.m#fetchSemanticColor

	/**
 	 * Converts an entry from semantic.colors.json to an 'rgba()' string
 	 * @param {object} entry entry from the semantic.colors.json file
 	 * @param {string} entry.color the base color hex (must be 3 or 6 digit hexadecimal string)
 	 * @param {string|number} [entry.alpha=100.0] the alpha value (as a percent, 0.0 - 100.0)
 	 * @returns {string|null}
 	 */
	function hexToRgb(entry) {
		let alpha = 1.0;
		let color = entry.color;
		if (entry.alpha) { // FIMXE: What if alpha is 0?
			alpha = parseFloat(entry.alpha) / 100.0; // convert from 0-100 range to 0-1 range
		}
		// TODO: if no alpha, assume 1, and skip conversion!
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		color = color.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

		const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
		return r ? `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha.toFixed(3)})` : null;
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
				return;
			}
		}

		try {
			if (!colorset[colorName]) {
				return fallbackColor;
			}

			const entry = colorset[colorName][Ti.UI.semanticColorType];
			// For now, return a string on iOS < 13, Android so we can pass the result directly to the UI property we want to set
			// Otherwise we need to modify the Android APIs to accept this faked Ti.UI.Color instance and convert it to it's own internal
			// Color representation
			if (typeof entry === 'string') {
				return entry; // should be a hex string (hopefully!)
			}
			if (!entry || typeof entry !== 'object') {  // it's not a string, nor an object, fail
				return fallbackColor;
			}
			const result = hexToRgb(entry);
			if (result) {
				return result;
			}
		} catch (error) {
			console.error(`Failed to lookup color for ${colorName}`);
		}
		return fallbackColor;
	};
}
