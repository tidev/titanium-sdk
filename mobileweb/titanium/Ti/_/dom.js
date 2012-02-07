/**
 * create(), attr(), place(), & remove() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/style"], function(_, style) {
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

		unitize: function(x) {
			return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
		},

		computeSize: function(x, totalLength, convertAutoToUndef) {
			var undef,
				type = require.is(x);

			if (type === "String") {
				if (x === "auto") {
					convertAutoToUndef && (x = undef);
				} else {
					var value = parseFloat(x),
						units = x.substring((value + "").length);

					switch(units) {
						case "%":
							if(totalLength == "auto") {
								convertAutoToUndef ? undef : "auto";
							} else if (!require.is(totalLength,"Number")) {
								console.error("Could not compute percentage size/position of element.");
								return;
							} 
							return value / 100 * totalLength;
						case "mm":
							value *= 10;
						case "cm":
							return value * 0.0393700787 * _.dpi;
						case "pc":
							dpi /= 12;
						case "pt":
							dpi /= 72;
						case "in":
							return value * _.dpi;
						case "px":
						case "dp":
							return value;
					}
				}
			} else if (type !== "Number") {
				x = undef;
			}

			return x;
		}
	};
});