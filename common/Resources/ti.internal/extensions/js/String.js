/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	String.prototype.localeCompare = function (compareString, locales, options) {
		const collator = new Intl.Collator(locales, options);
		return collator.compare(this, compareString);
	};

	String.prototype.toLocaleLowerCase = function (locale) {
		return Ti.Locale.makeLowerCase(this, locale);
	};

	String.prototype.toLocaleUpperCase = function (locale) {
		return Ti.Locale.makeUpperCase(this, locale);
	};
}
