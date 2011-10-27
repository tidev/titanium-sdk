exports.bootstrap = function(Titanium) {
	var TAG = "properties";
	var Properties = Titanium.App.Properties;

	function nullOrDefaultValue(defaultValue) {
		if (typeof(defaultValue) === 'undefined') {
			return null;
		}
		return defaultValue;
	}

	function propertyGetter(delegate) {
		return function(key, defaultValue) {
			if (!Properties.hasProperty(key)) {
				return nullOrDefaultValue(defaultValue);
			}
			return delegate.call(Properties, key);
		}
	}

	["getBool", "getDouble", "getInt", "getString"].forEach(function(getter) {
		Properties[getter] = propertyGetter(Properties[getter]);
	});

	Properties.getList = function(key, defaultValue) {
		if (!Properties.hasProperty(key)) {
			return nullOrDefaultValue(defaultValue);
		}

		return JSON.parse(Properties.getString(key));
	}

	Properties.setList = function(key, list) {
		Properties.setString(key, JSON.stringify(list));
	}
}