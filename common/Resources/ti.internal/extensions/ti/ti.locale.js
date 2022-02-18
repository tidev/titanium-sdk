/* globals OS_ANDROID */
if (OS_ANDROID) {
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
	global.L = Locale.getString;
}
