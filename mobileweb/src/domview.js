(function(oParentNamespace) {
	if (!oParentNamespace.EventDriven) {
		return false;
	}

	// create a generic DOM view 
	oParentNamespace.DOMView = function(obj, type, args, typename) {
		obj.addEventListener || oParentNamespace.EventDriven(obj);

		typename = typename || "TiDOMNode";

		var domNode = obj.dom = document.createElement(type);
		domNode.className = "HTML5_" + typename + " HTML5_DOMElement";

		obj.args = args = args || {};
		// Object for previous style rules
		obj.prevStyle = {};
		obj.parent = null;
		obj._children || (obj._children = []);

		obj.toString = function() {
			return "[object " + typename + "]";
		};
		
		obj._refresh = function(props) {
			if(props === null){
				return;
			}

			var domprops = props["domprops"],
				obj = props["obj"],
				complexDomprops = props["complexDomprops"],
				args = props["args"];

			if (domprops && args) {
				for (var ii = 0; ii < domprops.length; ii++) {
					// property name
					var domProp = domprops[ii];
					args[domProp] !== undefined && (domNode.style[domProp] = args[domProp]);
				}
			}

			if (complexDomprops && args) {
				for (ii = 0; ii < complexDomprops.length; ii++) {
					var propObj = complexDomprops[ii],
						propKey = null;
					for (var sProp in propObj) {
						propKey = sProp;
						break;
					}
					args[propKey] !== undefined && (obj[propKey] = args[propKey]);
				}
			}
		};

		var _layout;
		Ti._5.prop(obj, "layout", args.layout, {
			get: function() {
				return _layout;
			},
			set: function(val) {
				/^(horizontal|vertical)$/.test(val) || (val = "absolute");
				_layout = val;
				domNode.className = domNode.className.replace(/\s*HTML5_(vertical|horizontal)Layout\b/, "") + " HTML5_" + _layout + "Layout";
				// If layout option setted out of the constructor, we need to redraw object
				if (require.is(obj.render, "Function")) {
					obj.innerHTML = "";
					// if we have been rendered and add is called - re-render
					obj._rendered && obj.render();
				}
			}
		});
		
		// API Methods
		obj.render = function(parent) {
			var c, l,
				convertToMargins = true,
				domStyle = domNode.style;
				pos = "";

			if (!parent && !domNode.parentNode) {
				return;
			}
			if (parent) {
				if (parent.layout === "horizontal") {
					domStyle.display = "inline-block";
				} else if (parent.layout === "vertical") {
					domStyle.display = "";
				} else {
					convertToMargins = false;
					pos = "absolute";
				}

				if (convertToMargins) {
					// Note: we use margins instead of the actual left/right/top/bottom because margins play much nicer with our layout techniques.
					obj.left && (domStyle.marginLeft = obj.left);
					obj.top && (domStyle.marginTop = obj.top);
					obj.right && (domStyle.marginRight = obj.right);
					obj.bottom && (domStyle.marginBottom = obj.bottom);
					domStyle.left = domStyle.right = domStyle.top = domStyle.bottom = "auto";
				}
				parent._getAddContainer().appendChild(domNode);
				obj.fireEvent("html5_added", parent);
			} else {
				pos = "absolute";
			}

			domStyle.position = pos;

			for (c = 0, l = obj._children.length; c < l; c++) {
				obj._children[c].render(obj);
			}
			obj._rendered = true;
				
			// Give some time to browser to render the page
			setTimeout(function() {
				// Fire parent "finished" event 
				obj.parent && obj.parent.fireEvent("html5_child_rendered", obj);
				// Fire object "finished" event 
				obj.fireEvent("html5_rendered");
			}, 10);
		};
		
		// "Finished" event must bubbled to all parents
		obj.addEventListener("html5_child_rendered", function(oSource) {
			obj.parent && obj.parent.fireEvent("html5_child_rendered", oSource);
		}, false);

		obj._getAddContainer = function(){
			return domNode;
		};
	};
	
	oParentNamespace._getElementOffset = function(node) {
		var i,
			curleft = node.offsetLeft,
			curtop = node.offsetTop,
			w = 0,
			h = 0;

		while (i = (i || node).offsetParent) {
			curleft += i.offsetLeft;
			curtop += i.offsetTop;
		}

		for (i = 0; i < node.children.length; i++) {
			var oSizes = oParentNamespace._getElementOffset(node.children[i]);
			w = Math.max(w, oSizes.width + oSizes.left - curleft);
			h = Math.max(h, oSizes.height + oSizes.top - curtop);
		}

		return {
			left: curleft, 
			top: curtop,
			width: Math.max(w, node.offsetWidth),
			height: Math.max(h, node.offsetHeight)
		}
	};
	
	// Modify siple text to HTML text for looking as expected in some cases (like triple spaces)
	oParentNamespace._changeTextToHTML = function(text) {
		return (""+text).replace(/&/g, "&amp;").replace(/\s{3}/gm, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
	};
})(Ti._5);
