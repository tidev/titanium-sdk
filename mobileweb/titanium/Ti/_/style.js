define(["Ti/_", "Ti/_/string", "Ti/Filesystem"], function(_, string, Filesystem) {

	var vp = require.config.vendorPrefixes.dom,
		is = require.is,
		dummyNode = document.createElement("p");

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
						(is(value, "Array") ? value : [value]).forEach(function(v) { node.style[x] = v; });
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
		discover: function(name, node) {
			var i = 0,
				x,
				uc;

			node || (node = dummyNode);

			while (i < vp.length) {
				x = vp[i++];
				x += x ? uc || (uc = string.capitalize(name)) : name;
				if (x in node.style) {
					return x;
				}
			}

			return name;
		},

		get: function(node, name) {
			return node.style[this.discover(name, node)];
		},

		set: set,

		supports: function(name, node) {
			var x = this.discover(name, node);
			return x in node.style;
		},

		url: function(/*String|Blob*/url) {
			if (url && url.declaredClass === "Ti.Blob") {
				return "url(" + url.toString() + ")";
			}

			var match = url && url.match(/^(.+):\/\//),
				file = match && ~Filesystem.protocols.indexOf(match[1]) && Filesystem.getFile(url);

			return file && file.exists()
				? "url(" + file.read().toString() + ")"
				: !url || url === "none"
					? ""
					: /^url\(/.test(url)
						? url
						: "url(" + (require.cache(url) || _.getAbsolutePath(url)) + ")";
		}
	};
});