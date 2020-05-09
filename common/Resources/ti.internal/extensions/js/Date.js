/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

if (Ti.Android) {
	Date.prototype.toLocaleDateString = function () {
		const properties = Intl.DateTimeFormat._makeTiCreationPropertiesFrom(arguments);
		const mergedOptions = Object.assign({ dateStyle: 'short' }, properties.options);
		const formatter = new Intl.DateTimeFormat(properties.locale, mergedOptions);
		return formatter.format(this);
	};

	Date.prototype.toLocaleTimeString = function () {
		const properties = Intl.DateTimeFormat._makeTiCreationPropertiesFrom(arguments);
		const mergedOptions = Object.assign({ timeStyle: 'short' }, properties.options);
		const formatter = new Intl.DateTimeFormat(properties.locale, mergedOptions);
		return formatter.format(this);
	};

	Date.prototype.toLocaleString = Date.prototype.toLocaleDateString;
}
