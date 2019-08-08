/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

let colorset;
let osVersion;

// As Android passes a new instance of Ti.UI to every JS file we can't just
// Ti.UI within this file, we must call kroll.binding to get the Titanium
// namespace that is passed in with require and that deal with the .UI
// namespace that is on that directly.
let uiModule = Ti.UI;
if (Ti.Android) {
	uiModule = kroll.binding('Titanium').Titanium.UI;
}

uiModule.SEMANTIC_COLOR_TYPE_LIGHT = 'light';
uiModule.SEMANTIC_COLOR_TYPE_DARK = 'dark';

// We need to track this manually with a getter/setter
// due to the same reasons we use uiModule instead of Ti.UI
let currentColorType = uiModule.SEMANTIC_COLOR_TYPE_LIGHT;
Object.defineProperty(uiModule, 'semanticColorType', {
	get: () => {
		return currentColorType;
	},
	set: (colorType) => {
		currentColorType = colorType;
	}
});

uiModule.fetchSemanticColor = function fetchSemanticColor (colorName) {
	if (!osVersion) {
		osVersion = parseInt(Ti.Platform.version.split('.')[0]);
	}

	if (Ti.App.iOS && osVersion >= 13) {
		return Ti.UI.iOS.fetchSemanticColor(colorName);
	} else {
		if (!colorset) {
			try {
				colorset = require('/semantic.colors.json'); // eslint-disable-line import/no-absolute-path
			} catch (error) {
				console.error('Failed to require colors file at /semantic.colors.json');
				return;
			}
		}
		try {
			return colorset[colorName][uiModule.semanticColorType];
		} catch (error) {
			console.log(`Failed to lookup color for ${colorName}`);
		}
	}
};
