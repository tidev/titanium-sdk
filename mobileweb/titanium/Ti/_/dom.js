/**
 * create(), attr(), place(), & remove() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/API", "Ti/_/style"], function(_, API, style) {
	var is = require.is,
		forcePropNames = {
			innerHTML:	1,
			className:	1,
			value:		1
		},
		attrNames = {
			// original attribute names
			classname: "class",
			htmlfor: "for",
			// for IE
			tabindex: "tabIndex",
			readonly: "readOnly"
		},
		names = {
			// properties renamed to avoid clashes with reserved words
			"class": "className",
			"for": "htmlFor",
			// properties written as camelCase
			tabindex: "tabIndex",
			readonly: "readOnly",
			colspan: "colSpan",
			frameborder: "frameBorder",
			rowspan: "rowSpan",
			valuetype: "valueType"
		},
		attr = {
			set: function(node, name, value) {
				if (arguments.length === 2) {
					// the object form of setter: the 2nd argument is a dictionary
					for (var x in name) {
						attr.set(node, x, name[x]);
					}
					return node;
				}

				var lc = name.toLowerCase(),
					propName = names[lc] || name,
					forceProp = forcePropNames[propName],
					attrId, h;

				if (propName === "style" && !require.is(value, "String")) {
					return style.set(node, value);
				}

				if (forceProp || is(value, "Boolean") || is(value, "Function")) {
					node[name] = value;
					return node;
				}

				// node's attribute
				node.setAttribute(attrNames[lc] || name, value);
				return node;
			},
			remove: function(node, name) {
				node.removeAttribute(name);
				return node;
			}
		};

	return {
		create: function(tag, attrs, refNode, pos) {
			var doc = refNode ? refNode.ownerDocument : document;
			is(tag, "String") && (tag = doc.createElement(tag));
			attrs && attr.set(tag, attrs);
			refNode && this.place(tag, refNode, pos);
			return tag;
		},

		attr: attr,

		place: function(node, refNode, pos) {
			refNode.appendChild(node);
			return node;
		},

		detach: function(node) {
			return node.parentNode && node.parentNode.removeChild(node);
		},

		destroy: function(node) {
			try {
				var destroyContainer = node.ownerDocument.createElement("div");
				destroyContainer.appendChild(this.detach(node) || node);
				destroyContainer.innerHTML = "";
			} catch(e) {
				/* squelch */
			}
		},

		calculateDistance: function(ax, ay, bx, by) {
			return Math.sqrt(Math.pow(ax - bx,2) + Math.pow(ay - by, 2));
		},

		unitize: function(x) {
			return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
		},

		computeSize: function(x, totalLength, convertSizeToUndef) {
			if (is(x,"Number") && isNaN(x)) {
				return 0;
			}
			var type = require.is(x);
			if (type === "String") {
				var UI = require("Ti/UI");
				if (x === UI.SIZE) {
					convertSizeToUndef && (x = void 0);
				} else {
					var value = parseFloat(x),
						units = x.match(/.*(%|mm|cm|em|pt|in|px|dp)$/);
					if (units) {
						units = units[1];
					} else {
						units = "px";
					}

					switch(units) {
						case "%":
							if(totalLength == UI.SIZE) {
								convertSizeToUndef ? void 0 : UI.SIZE;
							} else if (!require.is(totalLength,"Number")) {
								API.error("Could not compute percentage size/position of element.");
								return;
							} 
							return value / 100 * totalLength;
						case "mm":
							value /= 10;
						case "cm":
							return value * 0.393700787 * _.dpi;
						case "em":
						case "pt":
							value /= 12;
						case "pc":
							value /= 6;
						case "in":
							return value * _.dpi;
						case "px":
							return value;
						case "dp":
							return value * _.dpi / 96;
					}
				}
			} else if (type !== "Number") {
				x = void 0;
			}

			return x;
		}
	};
});