'use strict';

exports.bootstrap = function (Titanium) {
	const Locale = Titanium.Locale;
	const wrappedGetString = Locale.getString;

	Locale.getString = function (key, defaultValue) {
		const defaultValueType = typeof defaultValue;
		// If the hint/default is not a string, ignore it!
		if (defaultValueType !== 'string') {
			return wrappedGetString.call(Locale, key);
		}

		return wrappedGetString.call(Locale, key, defaultValue);
	};
};
