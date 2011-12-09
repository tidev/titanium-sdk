(function(oParentNamespace) {
	if (!oParentNamespace.EventDriven) {
		return false;
	}
	// create a generic DOM view 
	oParentNamespace.DOMView = function(obj, type, args, typename) {
		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}
		obj.dom = document.createElement(type);
		obj.dom.className = 'HTML5_' + typename + ' HTML5_DOMElement';
		obj.args = args = args || {};
		// Object for previous style rules
		obj.prevStyle = {};
		obj.parent = null;
		
		typename = typename || '';

		obj.toString = function() {
			return '[object ' + typename + ']';
		};
		
		obj._refresh = function(props) {
			if(props == null){
				return;
			}
			
			var domprops = props['domprops'];
			var obj = props['obj'];
			var complexDomprops = props['complexDomprops'];
			var args = props['args'];

			if (domprops) {
				for (var ii = 0; ii < domprops.length; ii++) {
					// property name
					var domProp = domprops[ii];

					if (args && 'undefined' != typeof args[domProp]) {
						obj.dom.style[domProp] = args[domProp];
					}
				}
			}

			if (complexDomprops) {
				for (ii = 0; ii < complexDomprops.length; ii++) {
					var propObj = complexDomprops[ii];
					var propKey = null;
					for (var sProp in propObj) {
						propKey = sProp;
						break;
					}
					var propValue = propObj[propKey];

					if (args && 'undefined' != typeof args[propKey]) {
						obj[propKey] = args[propKey];
					}
				}
			}
		};

		var _layout;
		Ti._5.prop(obj, 'layout', args.layout, {
			get: function() {
				return _layout;
			},
			set: function(val) {
				_layout = val;
				obj.dom.className = obj.dom.className.replace(/\s*HTML5_(vertical|horizontal)Layout\b/, '') + ' HTML5_' + _layout + 'Layout';
				// If layout option setted out of the constructor, we need to redraw object
				if ('function' === typeof obj.render) {
					obj.innerHTML = '';
					// if we have been rendered and add is called - re-render
					if (obj._rendered) {
						obj.render(null);
					}
				}
			},
			configurable: true
		});
		
		// API Methods
		obj.render = function(parent) {
			if (!parent && !obj.dom.parentNode) {
				return;
			}
			if (parent) {
				var convertToMargins = true;
				if (parent.layout == 'horizontal') {
					obj.dom.style.display = 'inline-block';
					obj.dom.style.position = '';
				} else if (parent.layout == 'vertical') {
					obj.dom.style.display = '';
					obj.dom.style.position = '';
				} else {
					convertToMargins = false;
					obj.dom.style.position = 'absolute';
				}
				if (convertToMargins) {
					// Note: we use margins instead of the actual left/right/top/bottom because margins play much nicer with our layout techniques.
					if (obj.left) {
						obj.dom.style.marginLeft = obj.left;
					}
					if (obj.top) {
						obj.dom.style.marginTop = obj.top;
					}
					if (obj.right) {
						obj.dom.style.marginRight = obj.right;
					}
					if (obj.bottom) {
						obj.dom.style.marginBottom = obj.bottom;
					}
					obj.dom.style.left = '';
					obj.dom.style.right = '';
					obj.dom.style.top = '';
					obj.dom.style.bottom = '';
				}
				parent._getAddContainer().appendChild(obj.dom);
				obj.fireEvent('html5_added', parent);
			} else {
				obj.dom.style.position = 'absolute';
			}

			if (obj._children) {
				for (var c = 0; c < obj._children.length; c++) {
					obj._children[c].render(obj);
				}
			}
			obj._rendered = true;
				
			// Give some time to browser to render the page
			setTimeout(function() {
				// Fire parent 'finished' event 
				if (obj.parent) {
					obj.parent.fireEvent('html5_child_rendered', obj);
				}
				// Fire object 'finished' event 
				obj.fireEvent('html5_rendered');
			}, 10);
		};
		
		// 'Finished' event must bubbled to all parents
		obj.addEventListener('html5_child_rendered', function(oSource) {
			if (obj.parent) {
				obj.parent.fireEvent('html5_child_rendered', oSource);
			}
		}, false);

		obj._getAddContainer = function(){
			return obj.dom;
		};
		
	};
	
	oParentNamespace._getElementOffset = function(oEl) {
		var curleft = oEl.offsetLeft, curtop = oEl.offsetTop, iHeight = iWidth = 0;
		var iElHeight = oEl.offsetHeight, iElWidth = oEl.offsetWidth, oElRef = oEl.offsetParent;
		if (oElRef) {
			do {
				curleft += oElRef.offsetLeft;
				curtop += oElRef.offsetTop;
			} while (oElRef = oElRef.offsetParent);
		}
		for (var iCounter = 0; iCounter < oEl.children.length; iCounter++) {
			var oSizes = oParentNamespace._getElementOffset(oEl.children[iCounter]);
			iHeight = iHeight < oSizes.height + oSizes.top - curtop ? oSizes.height + oSizes.top - curtop : iHeight;
			iWidth = iWidth < oSizes.width + oSizes.left - curleft ? oSizes.width + oSizes.left - curleft : iWidth;
		}
		iHeight = iHeight < iElHeight ? iElHeight : iHeight;
		iWidth = iWidth < iElWidth ? iElWidth : iWidth;
		return {
			left:curleft, 
			top:curtop,
			height:iHeight,
			width:iWidth
		}
	};
	
	// Modify siple text to HTML text for looking as expected in some cases (like triple spaces)
	oParentNamespace._changeTextToHTML = function(text) {
		return (''+text).replace(/&/g, '&amp;').replace(/\s{3}/gm, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
	};
})(Ti._5);
