define(["Ti/_", "Ti/_/string"], function(_, string) {
	var vp = require.config.vendorPrefixes.dom;

	function set(node, name, value) {
		var i = 0,
			x,
			uc;
		if (node) {
			if (arguments.length > 2) {
				while (i < vp.length) {
					x = vp[i++];
					x += x ? uc || (uc = string.capitalize(name)) : name;
					if (x in node.style) {
						require.each(require.is(value, "Array") ? value : [value], function(v) { node.style[x] = v; });
						return value;
					}
				}
			} else {
				for (x in name) {
					set(node, x, name[x]);
				}
			}
		}
		return node;
	}

	return {
		url: function(url) {
			return !url || url === "none" ? "" : /^url\(/.test(url) ? url : "url(" + _.getAbsolutePath(url) + ")";
		},

		get: function(node, name) {
			if (require.is(name, "Array")) {
				for (var i = 0; i < name.length; i++) {
					name[i] = node.style[name[i]];
				}
				return name;
			}
			return node.style[name];
		},

		set: set
	};
});