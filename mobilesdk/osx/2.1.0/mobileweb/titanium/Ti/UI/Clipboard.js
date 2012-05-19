define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var storageKey = "ti:clipboard",
		plainText = "text/plain",
		error = 'Missing required argument "type"',
		value = localStorage.getItem(storageKey),
		cache = (require.is(value, "String") && JSON.parse(value)) || {};

	function get(type) {
		if (!type) {
			throw new Error(error);
		}
		return cache[type];
	}

	function set(type, data) {
		if (!type) {
			throw new Error(error);
		}
		if (data) {
			cache[type] = data;
		} else {
			delete cache[type];
		}
		save()
	}

	function save() {
		localStorage.setItem(storageKey, JSON.stringify(cache));
	}

	return lang.setObject("Ti.UI.Clipboard", Evented, {

		clearData: function() {
			cache = {};
			save();
		},

		clearText: function() {
			set(plainText);
		},

		getData: function(type) {
			return get(type) || null;
		},

		getText: function() {
			return get(plainText) || null;
		},

		hasData: function(type) {
			return !!get(type);
		},

		hasText: function() {
			return !!get(plainText);
		},

		setData: function(type, data) {
			set(type, data);
		},

		setText: function(text) {
			set(plainText, text);
		}

	});

});