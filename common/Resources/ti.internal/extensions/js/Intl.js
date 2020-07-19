/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

/**
 * Generates a "creation" properties dictionary for Titanium's Collator, DateTimeFormat, and NumberFormat proxies
 * from the given Intl type's constructor arguments.
 * @param {Object[]} args
 * The arguments array that was passed into Intl Collator, DateTimeFormat, or NumberFormat type's constructor.
 * @param {Function} supportedFormatLocalesFunction Reference to a supportedLocalesOf() function.
 * @return {Object} Returns a properties dictionary to be passed into a Titanium proxy's constructor.
 */
function makeTiFormatCreationPropertiesFrom(args, supportedFormatLocalesFunction) {
	const properties = {};
	if (args.length >= 1) {
		if (typeof args[0] === 'string') {
			properties.locale = args[0];
		} else if (Array.isArray(args[0])) {
			const supportedLocales = supportedFormatLocalesFunction(args[0]);
			if (supportedLocales.length > 0) {
				properties.locale = supportedLocales[0];
			}
		}
	}
	if ((args.length >= 2) && (typeof args[1] === 'object')) {
		properties.options = args[1];
	}
	return properties;
}

// Add "Intl" APIs missing on Android.
if (OS_ANDROID) {
	// Set up an "Intl.Collator" type which wraps our undocumented "Ti.Locale.Collator" proxy.
	function TiCollator() {
		const properties = makeTiFormatCreationPropertiesFrom(arguments, Ti.Locale.getSupportedCollatorLocales);
		const collator = new Ti.Locale.Collator(properties);
		collator.compare = collator.compare.bind(collator);
		return collator;
	}
	TiCollator.supportedLocalesOf = Ti.Locale.getSupportedCollatorLocales;

	// Set up an "Intl.DateTimeFormat" type which wraps our undocumented "Ti.Locale.DateTimeFormat" proxy.
	function TiDateTimeFormat() {
		const properties = makeTiFormatCreationPropertiesFrom(arguments, Ti.Locale.getSupportedDateTimeFormatLocales);
		return new Ti.Locale.DateTimeFormat(properties);
	}
	TiDateTimeFormat._makeTiCreationPropertiesFrom = (args) => {
		return makeTiFormatCreationPropertiesFrom(args, Ti.Locale.getSupportedDateTimeFormatLocales);
	};
	TiDateTimeFormat.supportedLocalesOf = Ti.Locale.getSupportedDateTimeFormatLocales;

	// Set up an "Intl.NumberFormat" type which wraps our undocumented "Ti.Locale.NumberFormat" proxy.
	function TiNumberFormat() {
		const properties = makeTiFormatCreationPropertiesFrom(arguments, Ti.Locale.getSupportedNumberFormatLocales);
		return new Ti.Locale.NumberFormat(properties);
	}
	TiNumberFormat.supportedLocalesOf = Ti.Locale.getSupportedNumberFormatLocales;

	// Make our custom "Intl" module available globally.
	global.Intl = {
		Collator: TiCollator,
		DateTimeFormat: TiDateTimeFormat,
		NumberFormat: TiNumberFormat,
		getCanonicalLocales: Ti.Locale.getCanonicalLocales
	};
}
