define(function () {
	var cache = {},
		stack = [];

	return {
		dynamic: true, // prevent the loader from caching the result

		normalize: function (name, normalize) {
			var parts = name.split("!"),
				url = parts[0];
			return (/^\./.test(url) ? normalize(url) : url) + (parts[1] ? "!" + parts[1] : "");
		},

		load: function (name, require, onLoad, config) {
			var url = require.toUrl(name, stack.length ? { name: stack[stack.length-1] } : null),
				c = cache[url] || require.cache(url),
				x;

			if (!c) {
				x = new XMLHttpRequest();
				x.open("GET", url, false);
				x.send(null);
				if (x.status === 200) {
					c = x.responseText;
				} else {
					throw new Error("Failed to load include \"" + url + "\": " + x.status);
				}
			}

			stack.push(url);
			try {
				require.evaluate(cache[url] = c, 0, true);
			} catch (e) {
				throw e;
			} finally {
				stack.pop();
			}

			onLoad(c);
		}
	};
});