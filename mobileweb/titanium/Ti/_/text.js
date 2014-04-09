define(function() {
	var cache = {};

	return {
		dynamic: true, // prevent the loader from caching the result

		normalize: function(name, normalize) {
			var parts = name.split("!"),
				url = parts[0];
			parts.shift();
			return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
		},

		load: function(name, require, onLoad, config) {
			var x,
				url = require.toUrl(name),
				c = cache[url] || require.cache(url);

			if (!c) {
				x = new XMLHttpRequest;
				x.open("GET", url, false);
				x.send(null);
				if (x.status === 200) {
					c = x.responseText;
				} else {
					throw new Error("Failed to load text \"" + url + "\": " + x.status);
				}
			}

			onLoad(c);
		}
	};
});
