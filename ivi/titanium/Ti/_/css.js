define(["Ti/_", "Ti/_/string"], function(_, string) {
	function processClass(node, cls, adding) {
		var i = 0, p,
			cn = " " + node.className + " ",
			cls = require.is(cls, "Array") ? cls : cls.split(" ");

		for (; i < cls.length; i++) {
			p = cn.indexOf(" " + cls[i] + " ");
			if (adding && p === -1) {
				cn += cls[i] + " ";
			} else if (!adding && p !== -1) {
				cn = cn.substring(0, p) + cn.substring(p + cls[i].length + 1);
			}
		}

		node.className = string.trim(cn);
	}

	return _.css = {
		add: function(node, cls) {
			processClass(node, cls, 1);
		},

		remove: function(node, cls) {
			processClass(node, cls);
		},

		clean: function(cls) {
			return cls.replace(/[^A-Za-z0-9\-]/g, "");
		}
	};
});