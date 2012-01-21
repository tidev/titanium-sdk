define("Ti/_/UI/Element",
	["Ti/_/browser", "Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/style", "Ti/_/Evented",
	"Ti/_/Gestures/DoubleTap","Ti/_/Gestures/LongPress","Ti/_/Gestures/Pinch","Ti/_/Gestures/SingleTap",
	"Ti/_/Gestures/Swipe","Ti/_/Gestures/TouchCancel","Ti/_/Gestures/TouchEnd","Ti/_/Gestures/TouchMove",
	"Ti/_/Gestures/TouchStart","Ti/_/Gestures/TwoFingerTap"],
	function(browser, css, declare, dom, event, lang, style, Evented,
		DoubleTap, LongPress, Pinch, SingleTap, Swipe, TouchCancel, TouchEnd, TouchMove, TouchStart, TwoFingerTap) {

	var undef,
		unitize = dom.unitize,
		computeSize = dom.computeSize,
		on = require.on,
		setStyle = style.set,
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
		curves = ["ease", "ease-in", "ease-in-out", "ease-out", "linear"];

	return declare("Ti._.UI.Element", Evented, {

		domType: null,
		domNode: null,

		constructor: function() {
			var self = this,

				node = this.domNode = this._setFocusNode(dom.create(this.domType || "div", {
					className: "TiUIElement " + css.clean(this.declaredClass),
					"data-widget-id": this.widgetId
				})),

				// Handle click/touch/gestures
				recognizers = this._gestureRecognizers = {
					Pinch: new Pinch,
					Swipe: new Swipe,
					TwoFingerTap: new TwoFingerTap,
					DoubleTap: new DoubleTap,
					LongPress: new LongPress,
					SingleTap: new SingleTap,
					TouchStart: new TouchStart,
					TouchEnd: new TouchEnd,
					TouchMove: new TouchMove,
					TouchCancel: new TouchCancel
				},

				// Each event could require a slightly different precedence of execution, which is why we have these separate lists.
				// For now they are the same, but I suspect they will be different once the android-iphone parity is determined.
				touchRecognizers = {
					Start: recognizers,
					Move: recognizers,
					End: recognizers,
					Cancel: recognizers
				},

				useTouch = "ontouchstart" in window,
				bg = lang.hitch(this, "_doBackground");

			function processTouchEvent(eventType, evt) {
				var i,
					gestureRecognizers = touchRecognizers[eventType],
					eventType = "Touch" + eventType + "Event",
					touches = evt.changedTouches;
				event.stop(evt);
				touches && event.stop(touches[0]);
				useTouch || require.mix(evt, {
					touches: evt.type === "mouseup" ? [] : [evt],
					targetTouches: [],
				    changedTouches: [evt]
				});
				for (i in gestureRecognizers) {
					gestureRecognizers[i]["process" + eventType](evt, self);
				}
				for (i in gestureRecognizers) {
					gestureRecognizers[i]["finalize" + eventType]();
				}
			}

			this._touching = false;

			on(this.domNode, useTouch ? "touchstart" : "mousedown", function(evt){
				var handles = [
					on(window, useTouch ? "touchmove" : "mousemove", function(evt){
						(useTouch || self._touching) && processTouchEvent("Move", evt);
					}),
					on(window, useTouch ? "touchend" : "mouseup", function(evt){
						self._touching = false;
						processTouchEvent("End", evt);
						event.off(handles);
					}),
					useTouch && on(window, "touchcancel", function(evt){
						processTouchEvent("Cancel", evt);
						event.off(handles);
					})
				];
				self._touching = true;
				processTouchEvent("Start", evt);
			});

			this.addEventListener("touchstart", bg);
			this.addEventListener("touchend", bg);

			// TODO: mixin JSS rules (http://jira.appcelerator.org/browse/TIMOB-6780)
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
				isDef(this.center) ? this.center.x : undef, isDef(this.center) ? this.center.y : undef,this.width,this.height,this.borderWidth);

			this._measuredLeft = dimensions.left;
			this._measuredTop = dimensions.top;
			this._measuredRightPadding = dimensions.rightPadding;
			this._measuredBottomPadding = dimensions.bottomPadding;
			this._measuredWidth = dimensions.width;
			this._measuredHeight = dimensions.height;
			this._measuredBorderWidth = dimensions.borderWidth;

			// Set the position, size and z-index
			isDef(this._measuredLeft) && setStyle(this.domNode, "left", unitize(this._measuredLeft));
			isDef(this._measuredTop) && setStyle(this.domNode, "top", unitize(this._measuredTop));
			isDef(this._measuredWidth) && setStyle(this.domNode, "width", unitize(this._measuredWidth));
			isDef(this._measuredHeight) && setStyle(this.domNode, "height", unitize(this._measuredHeight));
			setStyle(this.domNode, "zIndex", is(this.zIndex,"Number") ? this.zIndex : 0);
		},

		_computeDimensions: function(parentWidth,parentHeight,left,top,originalRight,originalBottom,centerX,centerY,width,height,borderWidth) {
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
			var borderWidth = computeSize(borderWidth);
			borderWidth = is(borderWidth,"Number") ? borderWidth: 0;
			if (width != "auto") {
				if (isDef(right)) {
					if (isDef(left)) {
						width = right - left;
					} else {
						left = right - width;
					}
				}
				width -= borderWidth * 2;
			}
			if (height != "auto") {
				if (isDef(bottom)) {
					if (isDef(top)) {
						height = bottom - top;
					} else {
						top = bottom - height;
					}
				}
				height -= borderWidth * 2;
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
			
			// Apply the origin and border width
			left += this._originX;
			top += this._originY;
			var rightPadding = is(originalRight,"Number") ? originalRight : 0,
				bottomPadding = is(originalBottom,"Number") ? originalBottom : 0;
			
			if(!is(left,"Number") || !is(top,"Number") || !is(rightPadding,"Number")
				 || !is(bottomPadding,"Number") || !is(width,"Number") || !is(height,"Number")) {
			 	throw "Invalid layout";
			}
			
			return {
				left: left,
				top:top,
				rightPadding: rightPadding,
				bottomPadding: bottomPadding,
				width: width,
				height: height,
				borderWidth: borderWidth
			};
		},
		
		// This method returns the offset of the content relative to the parent's location. 
		// This is useful for controls like ScrollView that can move the children around relative to itself.
		_getContentOffset: function(){
			return {x: 0, y: 0};
		},
		
		_isGestureBlocked: function(gesture) {
			for (var recognizer in this._gestureRecognizers) {
				var blockedGestures = this._gestureRecognizers[recognizer].blocking;
				for (var blockedGesture in blockedGestures) {
					if (gesture === blockedGestures[blockedGesture]) {
						return true;
					}
				}
			}
			return false;
		},
		
		_handleTouchEvent: function(type, e) {
			this.enabled && this.fireEvent(type, e);
		},

		_doBackground: function(evt) {
			var evt = evt || {},
				m = (evt.type || "").match(/mouse(over|out)/),
				node = this._focus.node,
				bc = this.backgroundColor,
				bi = this.backgroundImage;

			if (this._touching) {
				bc = this.backgroundSelectedColor || bc;
				bi = this.backgroundSelectedImage || bi;
			}

			m && (this._over = m[1] === "over");
			if (!this._touching && this.focusable && this._over) {
				bc = this.backgroundFocusedColor || bc;
				bi = this.backgroundFocusedImage || bi;
			}

			if (!this.enabled) {
				bc = this.backgroundDisabledColor || bc;
				bi = this.backgroundDisabledImage || bi;
			}

			setStyle(node, {
				backgroundColor: bc,
				backgroundImage: style.url(bi)
			});
		},

		_setFocusNode: function(node) {
			var f = this._focus = this._focus || {};

			if (f.node !== node) {
				f.node && event.off(f.evts);
				f.node = node;
				f.evts = ["focus", "blur", "mouseover", "mouseout", "mousemove"].map(function(e) {
					return on(node, e, this, "_doBackground");
				}, this);
			}

			return node;
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
					var transformCss = "";

					// Set the color and opacity properties
					anim.backgroundColor !== undef && (obj.backgroundColor = anim.backgroundColor);
					anim.opacity !== undef && setStyle(this.domNode, "opacity", anim.opacity);
					setStyle(this.domNode, "display", anim.visible !== undef && !anim.visible ? "none" : "");

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
						val(anim.height, this.height),
						val(anim.borderWidth, this.borderWidth)
					);

					setStyle(this.domNode, {
						left: unitize(dimensions.left),
						top: unitize(dimensions.top),
						width: unitize(dimensions.width),
						height: unitize(dimensions.height),
						borderWidth: unitize(dimensions.borderWidth)
					});

					// Set the z-order
					!isDef(anim.zIndex) && setStyle(this.domNode, "zIndex", anim.zIndex);

					// Set the transform properties
					if (anim.transform) {
						this._curTransform = this._curTransform ? this._curTransform.multiply(anim.transform) : anim.transform;
						transformCss = this._curTransform.toCSS();
					}

					setStyle(this.domNode, "transform", transformCss);
				}),
				done = function() {
					is(anim.complete, "Function") && anim.complete();
					is(callback, "Function") && callback();
				};

			Ti.UI._doForcedFullLayout();

			anim.duration = anim.duration || 0;
			anim.delay = anim.delay || 0;
			anim.transform && setStyle("transform", "");
			anim.start && anim.start();

			if (anim.duration > 0) {
				// Create the transition, must be set before setting the other properties
				setStyle(this.domNode, "transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));
				on.once(window, transitionEnd, lang.hitch(this, function(e) {
					// Clear the transform so future modifications in these areas are not animated
					setStyle(this.domNode, "transition", "");
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
			setStyle(this.domNode, "pointerEvents", value ? "auto" : "none");
			if (!value) {
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
			backgroundColor: {
				post: "_doBackground"
			},
			backgroundDisabledColor: {
				post: "_doBackground"
			},
			backgroundDisabledImage: {
				post: "_doBackground"
			},
			backgroundFocusedColor: {
				post: "_doBackground"
			},
			backgroundFocusedImage: {
				post: "_doBackground"
			},
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
						setStyle(this.domNode, "backgroundImage", "none");
						return;
					}

					require.each(colors, function(c) {
						output.push(c.color ? c.color + " " + (c.position * 100) + "%" : c);
					});

					output = type + "-gradient(" + output.join(",") + ")";

					require.each(vendorPrefixes.css, function(p) {
						setStyle(this.domNode, "backgroundImage", p + output);
					});

					return value;
				}
			},

			backgroundImage: {
				post: "_doBackground"
			},

			backgroundSelectedColor: {
				post: "_doBackground"
			},

			backgroundSelectedImage: {
				post: "_doBackground"
			},

			borderColor: {
				set: function(value) {
					if (setStyle(this.domNode, "borderColor", value)) {
						this.borderWidth | 0 || (this.borderWidth = 1);
						setStyle(this.domNode, "borderStyle", "solid");
					} else {
						this.borderWidth = 0;
					}
					return value;
				}
			},

			borderRadius: {
				set: function(value) {
					setStyle(this.domNode, "borderRadius", unitize(value));
					return value;
				}
			},

			borderWidth: {
				set: function(value) {
					setStyle(this.domNode, "borderWidth", unitize(value));
					this.borderColor || setStyle(this.domNode, "borderColor", "black");
					setStyle(this.domNode, "borderStyle", "solid");
					return value;
				}
			},

			color: {
				set: function(value) {
					return setStyle(this.domNode, "color", value);
				}
			},

			enabled: {
				post: "_doBackground",
				set: function(value) {
					this._focus.node.disabled = !value;
					return value;
				},
				value: true
			},

			focusable: {
				value: false,
				set: function(value) {
					dom.attr[value ? "add" : "remove"](this._focus.node, "tabindex", 0);
					return value;
				}
			},

			opacity: {
				set: function(value) {
					return this.domNode.style.opacity = value;
				}
			},

			visible: {
				set: function(value, orig) {
					if (value !== orig) {
						!value && (this._lastDisplay = style.get(this.domNode, "display"));
						setStyle(this.domNode, "display", !!value ? this._lastDisplay || "" : "none");
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

			transform: {
				set: function(value) {
					style.set(this.domNode, "transform", value.toCSS());
					return this._curTransform = value;
				}
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