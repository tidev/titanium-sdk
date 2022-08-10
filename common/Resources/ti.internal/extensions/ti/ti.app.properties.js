/* globals OS_ANDROID */
if (OS_ANDROID) {
	const Properties = Titanium.App.Properties;

	function nullOrDefaultValue(defaultValue) {
		if (typeof defaultValue === 'undefined') {
			return null;
		}
		return defaultValue;
	}

	function propertyGetter(delegate) {
		return function (key, defaultValue) {
			if (!Properties.hasProperty(key)) {
				return nullOrDefaultValue(defaultValue);
			}
			return delegate.call(Properties, key);
		};
	}

	[ 'getBool', 'getDouble', 'getInt', 'getString' ].forEach(function (getter) {
		Properties[getter] = propertyGetter(Properties[getter]);
	});

	Properties.getList = Properties.getObject = function (key, defaultValue) {
		if (!Properties.hasProperty(key)) {
			return nullOrDefaultValue(defaultValue);
		}

		return JSON.parse(Properties.getString(key));
	};

	Properties.setList = Properties.setObject = function (key, val) {
		Properties.setString(key, JSON.stringify(val));
	};
}
