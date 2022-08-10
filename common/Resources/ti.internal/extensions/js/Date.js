/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	Date.prototype.toLocaleDateString = function () {
		const properties = Intl.DateTimeFormat._makeTiCreationPropertiesFrom(arguments);
		const oldOptions = properties.options;
		if (!oldOptions || (!oldOptions.dateStyle && !oldOptions.month && !oldOptions.day && !oldOptions.year)) {
			const defaultOptions = {
				month: 'numeric',
				day: 'numeric',
				year: 'numeric'
			};
			properties.options = Object.assign(defaultOptions, oldOptions);
		}
		const formatter = new Intl.DateTimeFormat(properties.locale, properties.options);
		return formatter.format(this);
	};

	Date.prototype.toLocaleTimeString = function () {
		const properties = Intl.DateTimeFormat._makeTiCreationPropertiesFrom(arguments);
		const oldOptions = properties.options;
		if (!oldOptions || (!oldOptions.timeStyle && !oldOptions.hour && !oldOptions.minute && !oldOptions.second)) {
			const defaultOptions = {
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric'
			};
			properties.options = Object.assign(defaultOptions, oldOptions);
		}
		const formatter = new Intl.DateTimeFormat(properties.locale, properties.options);
		return formatter.format(this);
	};

	Date.prototype.toLocaleString = function () {
		const properties = Intl.DateTimeFormat._makeTiCreationPropertiesFrom(arguments);
		const oldOptions = properties.options;
		let hasOption = false;
		if (oldOptions) {
			hasOption
				=  !!oldOptions.dateStyle
				|| !!oldOptions.timeStyle
				|| !!oldOptions.weekday
				|| !!oldOptions.month
				|| !!oldOptions.day
				|| !!oldOptions.year
				|| !!oldOptions.hour
				|| !!oldOptions.minute
				|| !!oldOptions.second;
		}
		if (!hasOption) {
			const defaultOptions = {
				month: 'numeric',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric'
			};
			properties.options = Object.assign(defaultOptions, oldOptions);
		}
		const formatter = new Intl.DateTimeFormat(properties.locale, properties.options);
		return formatter.format(this);
	};
}
