define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var storageKey = "ti:properties",
		undef,
		types = {
			"Bool": function(value) {
				return !!value;
			},
			"Double": function(value) {
				return parseFloat(value);
			},
			"Int": function(value) {
				return parseInt(value);
			},
			"List": function(value) {
				return value === undef ? value : require.is(value, "Array") ? value : [value];
			},
			"String": function(value) {
				return "" + value;
			}
		},
		type,
		storage,
		api = lang.setObject("Ti.App.Properties",  Evented, {
			hasProperty: function(prop) {
				return !!getStorage(prop);
			},
			listProperties: function() {
				var storage = getStorage(),
					props = [],
					prop;
				for (prop in storage) {
					props.push(prop);
				}
				return props;
			},
			removeProperty: function(prop) {
				setProp(prop);
			}
		});

	function getStorage(prop) {
		storage || (storage = JSON.parse(localStorage.getItem(storageKey)) || {});
		if (prop) {
			return storage[prop];
		}
		return storage;
	}

	function getProp(prop, type, defaultValue) {
		var value = getStorage(prop);
		(value === undef || value === null) && (value = defaultValue);
		return types[type] ? types[type](value) : value;
	}

	function setProp(prop, type, value) {
		if (prop) {
			getStorage();
			if (value === undef) {
				delete storage[prop];
			} else {
				storage[prop] = types[type] ? types[type](value) : value;
			}
			localStorage.setItem(storageKey, JSON.stringify(storage));
		}
	}

	for (type in types) {
		(function(t) {
			api["get" + t] = function(prop, defaultValue) {
				return getProp(prop, t, defaultValue);
			};
			api["set" + t] = function(prop, value) {
				setProp(prop, t, value)
			};
		}(type));
	}

	return api;

});