define("Ti/_/UI/Element",
	["Ti/_/browser", "Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/lang", "Ti/_/style", "Ti/_/Evented"],
	function(browser, css, declare, dom, lang, style, Evented) {

	var undef,
		unitize = dom.unitize,
		computeSize = dom.computeSize,
		on = require.on,
		set = style.set,
		isDef = require.isDef,
		val = lang.val,
		is = require.is,
		transitionEvents = {
			webkit: "webkitTransitionEnd",
			trident: "msTransitionEnd",
			gecko: "transitionend",
			presto: "oTransitionEnd"
		},
		transitionEnd = transitionEvents[browser.runtime] || "transitionEnd",
		curTransform,
		curves = ["ease", "ease-in", "ease-in-out", "ease-out", "linear"];

	return declare("Ti._.UI.Element", Evented, {

		domType: null,
		domNode: null,

		constructor: function() {
			var bgSelPrevColor,
				bgSelPrevImage,
				bgFocusPrevColor;

			this.domNode = dom.create(this.domType || "div", {
				className: "TiUIElement " + css.clean(this.declaredClass)
			});

			// TODO: mixin JSS rules (http://jira.appcelerator.org/browse/TIMOB-6780)
			
			on(this.domNode, "click", lang.hitch(this,function(e){
				this._handleMouseEvent("click",{x: e.clientX, y: e.clientY});
			}));
			
			on(this.domNode, "dblclick", lang.hitch(this,function(e){
				this._handleMouseEvent("dblclick",{x: e.clientX, y: e.clientY});
			}));

			on(this.domNode, "focus", lang.hitch(this, function() {
				var tmp, node = this.domNode;

				this._origBg = style.get(node, ["backgroundColor", "backgroundImage"]);

				(tmp = this.backgroundSelectedColor) && style.set(node, "backgroundColor", tmp);
				(tmp = this.backgroundSelectedImage) && style.set(node, "backgroundImage", style.url(tmp));

				if (this.focusable) {
					(tmp = this.backgroundFocusedColor) && style.set(node, "backgroundColor", tmp);
					(tmp = this.backgroundFocusedImage) && style.set(node, "backgroundImage", style.url(tmp));
				}
			}));

			on(this.domNode, "blur", lang.hitch(this, function() {
				var bg = (this._origBg || []).concat([0, 0]);

				this.focusable && this.backgroundSelectedColor && (bg[0] = this.backgroundSelectedColor);
				bg[0] && style.set(this.domNode, "backgroundColor", bg[0]);

				this.focusable && this.backgroundSelectedImage && (bg[1] = this.backgroundSelectedImage);
				bg[1] && style.set(this.domNode, "backgroundImage", style.url(bg[1]));
			}));
		},

		destroy: function() {
			dom.destroy(this.domNode);
			this.domNode = null;
		},
		
		doLayout: function(originX,originY,parentWidth,parentHeight,centerHDefault,centerVDefault) {
			
			this._originX = originX;
			this._originY = originY;
			this._centerHDefault = centerHDefault;
			this._centerVDefault = centerVDefault;
			
			var dimensions = this._computeDimensions(parentWidth, parentHeight, this.left,this.top,this.right,this.bottom,
				isDef(this.center) ? this.center.x : undef,isDef(this.center) ? this.center.y : undef,this.width,this.height);
			
			this._measuredLeft = dimensions.left;
			this._measuredTop = dimensions.top;
			this._measuredRightPadding = dimensions.rightPadding;
			this._measuredBottomPadding = dimensions.bottomPadding;
			this._measuredWidth = dimensions.width;
			this._measuredHeight = dimensions.height;
					
			// Set the position, size and z-index
			isDef(this._measuredLeft) && set(this.domNode, "left", unitize(this._measuredLeft));
			isDef(this._measuredTop) && set(this.domNode, "top", unitize(this._measuredTop));
			isDef(this._measuredWidth) && set(this.domNode, "width", unitize(this._measuredWidth));
			isDef(this._measuredHeight) && set(this.domNode, "height", unitize(this._measuredHeight));
			set(this.domNode, "zIndex", is(this.zIndex,"Number") ? this.zIndex : 0);
		},
		
		_computeDimensions: function(parentWidth,parentHeight,left,top,originalRight,originalBottom,centerX,centerY,width,height) {
			
			// Compute as many sizes as possible, should be everything except auto
			left = computeSize(left,parentWidth),
			top = computeSize(top,parentHeight),
			originalRight = computeSize(originalRight,parentWidth),
			originalBottom = computeSize(originalBottom,parentHeight),
			centerX = isDef(centerX) ? computeSize(centerX,parentWidth) : undef,
			centerY = isDef(centerY) ? computeSize(centerY,parentHeight) : undef,
			width = computeSize(width,parentWidth),
			height = computeSize(height,parentHeight);
			
			// For our purposes, auto is the same as undefined for position values.
			left == "auto" && (left = undef);
			top == "auto" && (top = undef);
			originalRight == "auto" && (right = undef);
			originalBottom == "auto" && (bottom = undef);
			centerX == "auto" && (centerX = undef);
			centerY == "auto" && (centerY = undef);
			
			// Convert right/bottom coordinates to be with respect to (0,0)
			var right = isDef(originalRight) ? (parentWidth - originalRight) : undef,
				bottom = isDef(originalBottom) ? (parentHeight - originalBottom) : undef;
			
			// Unfortunately css precidence doesn't match the titanium, so we have to handle precedence and default setting ourselves
			if (isDef(width)) {
				if (isDef(left)) {
					right = undef;
				} else if (isDef(centerX)){
					if (width === "auto") {
						left = "calculateAuto";
					} else {
						left = centerX - width / 2;
						right = undef;
					}
				} else if (isDef(right)) {
					// Do nothing
				} else {
					// Set the default position
					left = "calculateAuto";
				}
			} else {
				if (isDef(centerX)) {
					if (isDef(left)) {
						width = (centerX - left) * 2;
						right = undef;
					} else if (isDef(right)) {
						width = (right - centerX) * 2;
					} else {
						// Set the default width
						width = computeSize(this._defaultWidth,parentWidth);
					}
				} else {
					if (isDef(left) && isDef(right)) {
						// Do nothing
					} else {
						width = computeSize(this._defaultWidth,parentWidth);
						if(!isDef(left) && !isDef(right)) {
							// Set the default position
							left = "calculateAuto";
						}
					}
				}
			}
			if (isDef(height)) {
				if (isDef(top)) {
					bottom = undef;
				} else if (isDef(centerY)){
					if(height === "auto") {
						top = "calculateAuto";
					} else {
						top = centerY - height / 2;
						bottom = undef;
					}
				} else if (isDef(bottom)) {
					// Do nothing
				} else {
					// Set the default position
					top = "calculateAuto";
				}
			} else {
				if (isDef(centerY)) {
					if (isDef(top)) {
						height = (centerY - top) * 2;
						bottom = undef;
					} else if (isDef(bottom)) {
						height = (bottom - centerY) * 2;
					} else {
						// Set the default height
						height = computeSize(this._defaultHeight,parentHeight);
					}
				} else {
					if (isDef(top) && isDef(bottom)) {
						// Do nothing
					} else {
						// Set the default height
						height = computeSize(this._defaultHeight,parentHeight);
						if(!isDef(top) && !isDef(bottom)) {
							// Set the default position
							top = "calculateAuto";
						}
					}
				}
			}
			
			// Calculate the width/left properties if width is NOT auto
			if (width != "auto") {
				if (isDef(right)) {
					if (isDef(left)) {
						width = right - left;
					} else {
						left = right - width;
					}
				}
			}
			if (height != "auto") {
				if (isDef(bottom)) {
					if (isDef(top)) {
						height = bottom - top;
					} else {
						top = bottom - height;
					}
				}
			}
			
			// TODO change this once we re-architect the inheritence so that widgets don't have add/remove/layouts
			if (this.children.length > 0) {
				var computedSize = this._layout.doLayout(this,width,height);
				width == "auto" && (width = computedSize.width);
				height == "auto" && (height = computedSize.height);
			} else {
				width == "auto" && (width = this._getContentWidth());
				height == "auto" && (height = this._getContentHeight());
			}
			
			// Set the default top/left if need be
			if (left == "calculateAuto") {
				left = this._centerHDefault ? computeSize("50%",parentWidth) - (is(width,"Number") ? width : 0) / 2 : 0;
			}
			if (top == "calculateAuto") {
				top = this._centerVDefault ? computeSize("50%",parentHeight) - (is(height,"Number") ? height : 0) / 2 : 0;
			}
			
			// Apply the origin
			left += this._originX;
			top += this._originY;
			
			if(!is(this._measuredLeft,"Number") || !is(this._measuredTop,"Number") || !is(this._measuredRightPadding,"Number")
				 || !is(this._measuredBottomPadding,"Number") || !is(this._measuredWidth,"Number") || !is(this._measuredHeight,"Number")) {
			 	throw "Invalid layout";
			}
			
			return {left: left,
				top:top,
				rightPadding: is(originalRight,"Number") ? originalRight: 0,
				bottomPadding: is(originalBottom,"Number") ? originalBottom: 0,
				width: width,
				height: height};
		},
		
		// This method returns the offset of the content relative to the parent's location. 
		// This is useful for controls like ScrollView that can move the children around relative to itself.
		_getContentOffset: function(){
			return {x: 0, y: 0};
		},
		
		_handleMouseEvent: function(type, e) {
			this.fireEvent(type, e);
		},

		show: function() {
			this.visible = true;
			//this.fireEvent("ti:shown");
		},

		hide: function() {
			this.visible = false;
			//obj.fireEvent("ti:hidden");
		},

		animate: function(anim, callback) {
			var anim = anim || {},
				curve = curves[anim.curve] || "ease",
				fn = lang.hitch(this, function() {
					var transform = "";

					// Set the color and opacity properties
					anim.backgroundColor !== undef && (obj.backgroundColor = anim.backgroundColor);
					anim.opacity !== undef && style.set(this.domNode, "opacity", anim.opacity);
					style.set(this.domNode, "display", anim.visible !== undef && !anim.visible ? "none" : "");

					// Set the position and size properties
					var dimensions = this._computeDimensions(
						this._parent ? this._parent._measuredWidth : "auto", 
						this._parent ? this._parent._measuredHeight : "auto", 
						val(anim.left, this.left),
						val(anim.top, this.top),
						val(anim.right, this.right),
						val(anim.bottom, this.bottom),
						isDef(anim.center) ? anim.center.x : isDef(this.center) ? this.center.x : undef,
						isDef(anim.center) ? anim.center.y : isDef(this.center) ? this.center.y : undef,
						val(anim.width, this.width),
						val(anim.height, this.height)
					);

					style.set(this.domNode, {
						left: unitize(dimensions.left),
						top: unitize(dimensions.top),
						width: unitize(dimensions.width),
						height: unitize(dimensions.height)
					});

					// Set the z-order
					!isDef(anim.zIndex) && style.set(this.domNode, "zIndex", anim.zIndex);

					// Set the transform properties
					if (anim.transform) {
						curTransform = curTransform ? curTransform.multiply(anim.transform) : anim.transform;
						transform = curTransform.toCSS();
					}

					style.set(this.domNode, "transform", transform);
				}),
				done = function() {
					is(anim.complete, "Function") && anim.complete();
					is(callback, "Function") && callback();
				};
			Ti.UI._doForcedFullLayout();

			anim.duration = anim.duration || 0;
			anim.delay = anim.delay || 0;
			anim.transform && style.set("transform", "");
			anim.start && anim.start();

			if (anim.duration > 0) {
				// Create the transition, must be set before setting the other properties
				style.set(this.domNode, "transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));
				on.once(window, transitionEnd, lang.hitch(this, function(e) {
					// Clear the transform so future modifications in these areas are not animated
					style.set(this.domNode, "transition", "");
					done();
				}));
				setTimeout(fn, 0);
			} else {
				fn();
				done();
			}
		},
		
		_getContentWidth: function() {
			return this.domNode.clientWidth;
		},
		
		_getContentHeight: function() {
			return this.domNode.clientHeight;
		},
		
		_setTouchEnabled: function(value) {
			set(this.domNode,"pointerEvents", value ? "auto" : "none");
			if(!value) {
				for (var i in this.children) {
					this.children[i]._setTouchEnabled(value);
				}
			}
		},
		
		_measuredLeft: 0,
		_measuredTop: 0,
		_measuredRightPadding: 0,
		_measuredBottomPadding: 0,
		_measuredWidth: 0,
		_measuredHeight: 0,

		properties: {
			
			// Properties that are handled by the element
			backgroundColor: {
				set: function(value) {
					return style.set(this.domNode, "backgroundColor", value);
				}
			},
			backgroundFocusedColor: undef,
			backgroundFocusedImage: undef,
			backgroundGradient: {
				set: function(value) {
					var value = value || {},
						output = [],
						colors = value.colors || [],
						type = value.type,
						start = value.startPoint,
						end = value.endPoint;

					if (type === "linear") {
						start && end && start.x != end.x && start.y != end.y && output.concat([
							unitize(value.startPoint.x) + " " + unitize(value.startPoint.y),
							unitize(value.endPoint.x) + " " + unitize(value.startPoint.y)
						]);
					} else if (type === "radial") {
						start = value.startRadius;
						end = value.endRadius;
						start && end && output.push(unitize(start) + " " + unitize(end));
						output.push("ellipse closest-side");
					} else {
						style.set(this.domNode, "backgroundImage", "none");
						return;
					}

					require.each(colors, function(c) {
						output.push(c.color ? c.color + " " + (c.position * 100) + "%" : c);
					});

					output = type + "-gradient(" + output.join(",") + ")";

					require.each(vendorPrefixes.css, function(p) {
						style.set(this.domNode, "backgroundImage", p + output);
					});

					return value;
				}
			},
			backgroundImage: {
				set: function(value) {
					return style.set(this.domNode, "backgroundImage", value ? style.url(value) : "");
				}
			},
			backgroundSelectedColor: undef,
			backgroundSelectedImage: undef,
			borderColor: {
				set: function(value) {
					if (style.set(this.domNode, "borderColor", value)) {
						this.borderWidth | 0 || (this.borderWidth = 1);
						style.set(this.domNode, "borderStyle", "solid");
					} else {
						this.borderWidth = 0;
					}
					return value;
				}
			},
			borderRadius: {
				set: function(value) {
					style.set(this.domNode, "borderRadius", unitize(value));
					return value;
				}
			},
			borderWidth: {
				set: function(value) {
					style.set(this.domNode, "borderWidth", unitize(value));
					this.borderColor || style.set(this.domNode, "borderColor", "black");
					style.set(this.domNode, "borderStyle", "solid");
					return value;
				}
			},
			color: {
				set: function(value) {
					return style.set(this.domNode, "color", value);
				}
			},
			focusable: undef,
			opacity: {
				set: function(value) {
					return this.domNode.style.opacity = value;
				}
			},
			visible: {
				set: function(value, orig) {
					if (value !== orig) {
						!value && (this._lastDisplay = style.get(this.domNode, "display"));
						style.set(this.domNode, "display", !!value ? this._lastDisplay || "" : "none");
						!!value && Ti.UI._doFullLayout();
					}
					return value;
				}
			},
			
			touchEnabled: {
				set: function(value) {
					this._setTouchEnabled(value);
					return value;
				},
				value: true
			},
			
			// Properties that are handled by the layout manager
			bottom: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			center: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			height: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			left: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			right: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			top: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			width: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			zIndex: {
				set: function(value) {
					Ti.UI._doFullLayout();
					return value;
				}
			},
			
			size: {
				set: function(value) {
					console.debug('Property "Titanium._.UI.Element#.size" is not implemented yet.');
					return value;
				}
			}
		}

	});

});