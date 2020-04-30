/**
 * This file contains various utility functions.
 */

/**
 * Creates a new tab for a tab group applying various defaults and merging
 * it with the specified options.
 *
 * @param {object} options Options for the new tab
 * @return {object} The created tab
 */
export function createTab(options) {
	const defaults = {
		activeTintColor: '#E82C2A',
		activeTitleColor: '#E82C2A'
	};
	const mergedOptions = Object.assign({}, defaults);
	if (runs('android')) {
		Object.assign(mergedOptions, {
			titleColor: '#f8bbc2',
			activeTitleColor: '#fff'
		});
		delete options.icon;
	}
	Object.assign(mergedOptions, options);
	return Ti.UI.createTab(mergedOptions);
}

/**
 * Checks if the current device runs the specified platform.
 *
 * @param {string} platform Platform name to check
 * @return {boolean} True if current device is running on the specified platform, false if not.
 */
export function runs(platform) {
	return Ti.Platform.osname === platform
    || (platform === 'ios' && [ 'iphone', 'ipad' ].includes(Ti.Platform.osname));
}

/**
 * Creates a new window applying various defaults and merging
 * it with the specified options.
 *
 * @param {object} options Options for the new window
 * @return {object} The created window
 */
export function createWindow(options) {
	const defaults = {
		backgroundColor: '#fff',
		barColor: '#E82C2A',
		titleAttributes: {
			color: '#fff'
		},
		navTintColor: '#fff'
	};
	return Ti.UI.createWindow(Object.assign({}, defaults, options));
}

const fontMap = {
	brands: 'FontAwesome5Brands-Regular',
	regular: 'FontAwesome5Free-Regular',
	solid: 'FontAwesome5Free-Solid'
};

/**
 * Creates a new label displaying the specified Font Awesome 5 icon.
 *
 * @param {string} icon Icon name
 * @param {number|string} size Font size of the icon
 * @param {string} [style=solid] Icon style to use
 * @param {object=} options Additional options for the label
 * @return {object} Configured label for the specified FontAwesome icon
 */
export function faIcon(icon, size, style = 'solid', options = {}) {
	if (typeof style === 'object') {
		options = style;
		style = null;
	}
	if (style === null) {
		style = 'solid';
	}
	const fontFamily = fontMap[style];
	return Ti.UI.createLabel(Object.assign({}, {
		font: {
			fontFamily,
			fontSize: size
		},
		text: icon
	}, options));
}
