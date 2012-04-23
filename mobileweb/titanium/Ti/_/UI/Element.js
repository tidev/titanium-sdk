define(
	["Ti/_/browser", "Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/style", "Ti/_/Evented",
	"Ti/UI", "Ti/_/Gestures/DoubleTap","Ti/_/Gestures/LongPress","Ti/_/Gestures/Pinch","Ti/_/Gestures/SingleTap",
	"Ti/_/Gestures/Swipe","Ti/_/Gestures/TouchCancel","Ti/_/Gestures/TouchEnd","Ti/_/Gestures/TouchMove",
	"Ti/_/Gestures/TouchStart","Ti/_/Gestures/TwoFingerTap", "Ti/_/Promise"],
	function(browser, css, declare, dom, event, lang, style, Evented, UI,
		DoubleTap, LongPress, Pinch, SingleTap, Swipe, TouchCancel, TouchEnd,
		TouchMove, TouchStart, TwoFingerTap, Promise) {

	var unitize = dom.unitize,
		computeSize = dom.computeSize,
		on = require.on,
		setStyle = style.set,
		isDef = lang.isDef,
		val = lang.val,
		is = require.is,
		transitionEvents = {
			webkit: "webkitTransitionEnd",
			trident: "msTransitionEnd",
			gecko: "transitionend",
			presto: "oTransitionEnd"
		},
		transitionEnd = transitionEvents[browser.runtime] || "transitionEnd",
		curves = ["ease", "ease-in", "ease-in-out", "ease-out", "linear"],
		postDoBackground = {
			post: "_doBackground"
		},
		postLayoutPropFunction = function(value, oldValue) {
			if (value !== oldValue) {
				!this._batchUpdateInProgress && this._triggerLayout();
			}
			return value;
		},
		postLayoutProp = {
			set: postLayoutPropFunction
		},
		pixelUnits = "px";

	return declare("Ti._.UI.Element", Evented, {

		domType: null,
		domNode: null,
		_alive: 1,

		constructor: function(args) {
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

			require.has("devmode") && args && args._debug && dom.attr.set(node, "data-debug", args._debug);

			function processTouchEvent(eventType, evt) {
				var i,
					gestureRecognizers = touchRecognizers[eventType],
					eventType = "Touch" + eventType + "Event",
					touches = evt.changedTouches;
				if (this._preventDefaultTouchEvent) {
					this._preventDefaultTouchEvent && evt.preventDefault && evt.preventDefault();
					for (i in touches) {
						touches[i].preventDefault && touches[i].preventDefault();
					}
				}
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

			var values = this.constants.__values__;
			this._layoutCoefficients = {
				width: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				sandboxWidth: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				height: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				sandboxHeight: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				left: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				top: {
					x1: 0,
					x2: 0,
					x3: 0,
					x4: 0
				}
			};
			values.size = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			values.rect = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		},

		_setParent: function(view) {
			this._parent = view;
		},
		
		_add: function(view) {
			view._setParent(this);
			
			this.children.push(view);
			this.containerNode.appendChild(view.domNode);
			
			view._triggerLayout();
		},

		_insertAt: function(view,index) {
			if (index > this.children.length || index < 0) {
				return;
			} else if (index === this.children.length) {
				this.add(view);
			} else {
				view._parent = this;
				this.containerNode.insertBefore(view.domNode,this.children[index].domNode);
				this.children.splice(index,0,view);
				this._triggerLayout();
			}
		},

		_remove: function(view) {
			var p = this.children.indexOf(view);
			if (p !== -1) {
				this.children.splice(p, 1);
				view._setParent();
				dom.detach(view.domNode);
				this._triggerLayout();
			}
		},

		_removeAllChildren: function(view) {
			var children = this.children;
			while (children.length) {
				this.remove(children[0]);
			}
			this._triggerLayout();
		},

		destroy: function() {
			if (this._alive) {
				this._parent && this._parent._remove(this);
				if (this.domNode) {
					dom.destroy(this.domNode);
					this.domNode = null;
				}
			}
			Evented.destroy.apply(this, arguments);
		},
		
		_isAttachedToActiveWin: function() {
			// If this element is not attached to an active window, skip the calculation
			var isAttachedToActiveWin = false,
				node = this;
			while(node) {
				if (node === UI._container) {
					isAttachedToActiveWin = true;
					break;
				}
				node = node._parent;
			}
			return isAttachedToActiveWin;
		},
		
		_needsMeasuring: true,
		
		_triggerLayout: function(force) {
			this._needsMeasuring = true;
			this._isAttachedToActiveWin() && (!this._batchUpdateInProgress || force) && UI._triggerLayout(this, force);
		},
		
		_hasSizeDimensions: function() {
			return isNaN(this._layoutCoefficients.width.x1) || isNaN(this._layoutCoefficients.height.x1);
		},
		
		startLayout: function() {
			this._batchUpdateInProgress = true;
		},
		
		finishLayout: function() {
			this._batchUpdateInProgress = false;
			UI._triggerLayout(this, true);
		},
		
		updateLayout: function(params) {
			this.startLayout();
			for(var i in params) {
				this[i] = params[i];
			}
			this.finishLayout();
		},
		
		convertPointToView: function(point, destinationView) {
			
			// Make sure that both nodes are connected to the root
			if (!this._isAttachedToActiveWin() || !destinationView._isAttachedToActiveWin()) {
				return null;
			}
			
			if (!point || !is(point.x,"Number") || !is(point.y,"Number")) {
				throw new Error("Invalid point");
			}
			
			if (!destinationView.domNode) {
				throw new Error("Invalid destination view");
			}
			
			function getAbsolutePosition(node, point, additive) {
				var x = point.x,
					y = point.y,
					multiplier = (additive ? 1 : -1);
					
				while(node) {
					x += multiplier * node.domNode.offsetLeft;
					y += multiplier * node.domNode.offsetTop;
					node = node._parent;
				}
					
				return {x: x, y: y};
			}
			
			// Find this node's location relative to the root
			return getAbsolutePosition(destinationView,getAbsolutePosition(this,point,true),false);
		},

		// This method returns the offset of the content relative to the parent's location. 
		// This is useful for controls like ScrollView that can move the children around relative to itself.
		_getContentOffset: function(){
			return {x: 0, y: 0};
		},
		
		_computeGradient: function() {
			
			var backgroundGradient = this.backgroundGradient;
				colors = backgroundGradient.colors,
				type = backgroundGradient.type,
				cssVal = type + "-gradient(";
			
			// Convert common units to absolute
			var startPointX = computeSize(backgroundGradient.startPoint.x, this._measuredWidth),
				startPointY = computeSize(backgroundGradient.startPoint.y, this._measuredHeight),
				centerX = computeSize("50%", this._measuredWidth),
				centerY = computeSize("50%", this._measuredHeight),
				numColors = colors.length;
			
			if (type === "linear") {
				
				// Convert linear specific values to absolute
				var endPointX = computeSize(backgroundGradient.endPoint.x, this._measuredWidth),
					endPointY = computeSize(backgroundGradient.endPoint.y, this._measuredHeight);
					
				var userGradientStart,
					userGradientEnd;
				if (Math.abs(startPointX - endPointX) < 0.01) {
					// Vertical gradient shortcut
					if (startPointY < endPointY) {
						userGradientStart = startPointY;
						userGradientEnd = endPointY;
						cssVal += "270deg";
					} else {
						userGradientStart = endPointY;
						userGradientEnd = startPointY;
						cssVal += "90deg";
					}
				} else if(Math.abs(startPointY - endPointY) < 0.01) {
					// Horizontal gradient shortcut
					if (startPointX < endPointX) {
						userGradientStart = startPointX;
						userGradientEnd = endPointX;
						cssVal += "0deg";
					} else {
						userGradientStart = endPointX;
						userGradientEnd = startPointX;
						cssVal += "180deg";
					}
				}else {
					
					// Rearrange values so that start is to the left of end
					var mirrorGradient = false;
					if (startPointX > endPointX) {
						mirrorGradient = true;
						var temp = startPointX;
						startPointX = endPointX;
						endPointX = temp;
						temp = startPointY;
						startPointY = endPointY;
						endPointY = temp;
					}
					
					// Compute the angle, start location, and end location of the gradient
					var angle = Math.atan2(endPointY - startPointY, endPointX - startPointX)
						tanAngle = Math.tan(angle),
						cosAngle = Math.cos(angle),
						originLineIntersection = centerY - centerX * tanAngle;
						userDistance = (startPointY - startPointX * tanAngle - originLineIntersection) * cosAngle,
						userXOffset = userDistance * Math.sin(angle),
						userYOffset = userDistance * cosAngle,
						startPointX = startPointX + userXOffset,
						startPointY = startPointY - userYOffset,
						endPointX = endPointX + userXOffset,
						endPointY = endPointY - userYOffset,
						shiftedAngle = Math.PI / 2 - angle;
					if (angle > 0) {
						var globalGradientStartDistance = originLineIntersection * Math.sin(shiftedAngle),
							globalGradientStartOffsetX = -globalGradientStartDistance * Math.cos(shiftedAngle),
							globalGradientStartOffsetY = globalGradientStartDistance * Math.sin(shiftedAngle);
						userGradientStart = Math.sqrt(Math.pow(startPointX - globalGradientStartOffsetX,2) + Math.pow(startPointY - globalGradientStartOffsetY,2));
						userGradientEnd = Math.sqrt(Math.pow(endPointX - globalGradientStartOffsetX,2) + Math.pow(endPointY - globalGradientStartOffsetY,2));
					} else {
						var globalGradientStartDistance = (this._measuredHeight - originLineIntersection) * Math.sin(shiftedAngle),
							globalGradientStartOffsetX = -globalGradientStartDistance * Math.cos(shiftedAngle),
							globalGradientStartOffsetY = this._measuredHeight - globalGradientStartDistance * Math.sin(shiftedAngle);
						userGradientStart = Math.sqrt(Math.pow(startPointX - globalGradientStartOffsetX,2) + Math.pow(startPointY - globalGradientStartOffsetY,2));
						userGradientEnd = Math.sqrt(Math.pow(endPointX - globalGradientStartOffsetX,2) + Math.pow(endPointY - globalGradientStartOffsetY,2));
					}
					
					// Set the angle info for the gradient
					angle = mirrorGradient ? angle + Math.PI : angle;
					cssVal += Math.round((360 * (2 * Math.PI - angle) / (2 * Math.PI))) + "deg";
				}
				
				// Calculate the color stops
				for (var i = 0; i < numColors; i++) {
					var color = colors[i];
					if (is(color,"String")) {
						color = { color: color };
					}
					if (!is(color.offset,"Number")) {
						color.offset = i / (numColors - 1);
					}
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * color.offset + "%", userGradientEnd - userGradientStart) + userGradientStart) + pixelUnits;
				}
				
			} else if (type === "radial") {
				
				// Convert radial specific values to absolute
				var radiusTotalLength = Math.min(this._measuredWidth,this._measuredHeight),
					startRadius = computeSize(backgroundGradient.startRadius, radiusTotalLength),
					endRadius = computeSize(backgroundGradient.endRadius, radiusTotalLength);
				
				var colorList = [],
					mirrorGradient = false;
				if (startRadius > endRadius) {
					var temp = startRadius;
					startRadius = endRadius;
					endRadius = temp;
					mirrorGradient = true;
					
					for (var i = 0; i <= (numColors - 2) / 2; i++) {
						var mirroredPosition = numColors - i - 1;
						colorList[i] = colors[mirroredPosition],
						colorList[mirroredPosition] = colors[i];
					}
					if (numColors % 2 === 1) {
						var middleIndex = Math.floor(numColors / 2);
						colorList[middleIndex] = colors[middleIndex];
					}
				} else {
					for (var i = 0; i < numColors; i++) {
						colorList[i] = colors[i];
					}
				}
				
				cssVal += startPointX + pixelUnits + " " + startPointY + pixelUnits;
				
				// Calculate the color stops
				for (var i = 0; i < numColors; i++) {
					var color = colorList[i];
					if (is(color,"String")) {
						color = { color: color };
					}
					var offset;
					if (!is(color.offset,"Number")) {
						offset = i / (numColors - 1);
					} else {
						offset = mirrorGradient ? numColors % 2 === 1 && i === Math.floor(numColors / 2) ? color.offset : 1 - color.offset : color.offset;
					}
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * offset + "%", endRadius - startRadius) + startRadius) + pixelUnits;
				}
			}

			cssVal += ")";

			require.each(require.config.vendorPrefixes.css, lang.hitch(this,function(vendorPrefix) {
				setStyle(this.domNode, "backgroundImage", vendorPrefix + cssVal);
			}));
		},
		
		_preventDefaultTouchEvent: true,

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
		
		_defaultBackgroundColor: void 0,
		
		_defaultBackgroundImage: void 0,
		
		_defaultBackgroundDisabledColor: void 0,
		
		_defaultBackgroundDisabledImage: void 0,
		
		_defaultBackgroundFocusedColor: void 0,
		
		_defaultBackgroundFocusedImage: void 0,
		
		_defaultBackgroundSelectedColor: void 0,
		
		_defaultBackgroundSelectedImage: void 0,
		
		_borderLeftWidth: 0,
		
		_borderRightWidth: 0,
		
		_borderTopWidth: 0,
		
		_borderBottomWidth: 0,

		_doBackground: function(evt) {
			var evt = evt || {},
				m = (evt.type || "").match(/mouse(over|out)/),
				node = this.domNode,
				bi = this.backgroundImage || this._defaultBackgroundImage || "none",
				bc = this.backgroundColor || this._defaultBackgroundColor;

			if (this._touching) {
				bc = this.backgroundSelectedColor || this._defaultBackgroundSelectedColor || bc;
				bi = this.backgroundSelectedImage || this._defaultBackgroundSelectedImage || bi;
			}

			m && (this._over = m[1] === "over");
			if (!this._touching && this.focusable && this._over) {
				bc = this.backgroundFocusedColor || this._defaultBackgroundFocusedColor || bc;
				bi = this.backgroundFocusedImage || this._defaultBackgroundFocusedImage || bi;
			}

			if (!this.enabled) {
				bc = this.backgroundDisabledColor || this._defaultBackgroundDisabledColor || bc;
				bi = this.backgroundDisabledImage || this._defaultBackgroundDisabledImage || bi;
			}

			!this.backgroundGradient && setStyle(node, {
				backgroundColor: bc || (bi && bi !== "none" ? "transparent" : ""),
				backgroundImage: style.url(bi)
			});
		},

		_setFocusNode: function(node) {
			var f = this._focus = this._focus || {};

			if (f.node !== node) {
				if (f.node) {
					event.off(f.evts);
					event.off(f.evtsMore);
				}
				f.node = node;
				f.evts = [
					on(node, "focus", this, "_doBackground"),
					on(node, "blur", this, "_doBackground") /*,
					on(node, "mouseover", this, function() {
						this._doBackground();
						f.evtsMore = [
							on(node, "mousemove", this, "_doBackground"),
							on(node, "mouseout", this, function() {
								this._doBackground();
								event.off(f.evtsMore);
								f.evtsMore = [];
							})
						];
					})*/
				];
			}

			return node;
		},

		show: function() {
			this.visible = true;
		},

		hide: function() {
			this.visible = false;
		},

		animate: function(anim, callback) {
			if (UI._layoutInProgress) {
				on.once(UI,"postlayout", lang.hitch(this,function(){
					this._doAnimation(anim,callback);
				}));
			} else {
				this._doAnimation(anim,callback);
			}
		},
		
		_doAnimation: function(anim, callback) {
			var anim = anim || {},
				curve = curves[anim.curve] || "ease",
				fn = lang.hitch(this, function() {
					var transformCss = "";

					// Set the color and opacity properties
					anim.backgroundColor !== void 0 && (this.backgroundColor = anim.backgroundColor);
					anim.opacity !== void 0 && setStyle(this.domNode, "opacity", anim.opacity);
					setStyle(this.domNode, "display", anim.visible !== void 0 && !anim.visible ? "none" : "");
					
					// Set the position and size properties
					
					if (!["left", "top", "right", "bottom", "center", "width", "height"].every(function(v) { return !isDef(anim[v]); })) {
						// TODO set border width here

						var dimensions = this._computeDimensions({
							layoutParams: this._layoutParams,
							position: {
								left: val(anim.left, this.left),
								top: val(anim.top, this.top),
								right: val(anim.right, this.right),
								bottom: val(anim.bottom, this.bottom),
								center: anim.center || this.center
							},
							size: {
								width: val(anim.width, this.width),
								height: val(anim.height, this.height)
							},
							layoutChildren: false
						});
	
						setStyle(this.domNode, {
							left: unitize(dimensions.left),
							top: unitize(dimensions.top),
							width: unitize(dimensions.width),
							height: unitize(dimensions.height),
							borderLeftWidth: unitize(dimensions.borderSize.left),
							borderTopWidth: unitize(dimensions.borderSize.top),
							borderRightWidth: unitize(dimensions.borderSize.right),
							borderBottomWidth: unitize(dimensions.borderSize.bottom)
						});
					}

					// Set the z-order
					!isDef(anim.zIndex) && setStyle(this.domNode, "zIndex", anim.zIndex);

					// Set the transform properties
					if (anim.transform) {
						this._curTransform = this._curTransform ? this._curTransform.multiply(anim.transform) : anim.transform;
						transformCss = this._curTransform.toCSS();
					}

					setStyle(this.domNode, "transform", transformCss);
				});

			anim.duration = anim.duration || 0;
			anim.delay = anim.delay || 0;
			anim.transform && setStyle(this.domNode, "transform", "");
			anim.start && anim.start();

			if (anim.duration > 0) {
				
				function completeAnimation(){
					if (!this._destroyed) {
						// Clear the transform so future modifications in these areas are not animated
						setStyle(this.domNode, "transition", "");
						is(anim.complete, "Function") && anim.complete();
						is(callback, "Function") && callback();
					}
				}
				
				// Create the transition, must be set before setting the other properties
				if (style.supports("transition", this.domNode)) {
					setStyle(this.domNode, "transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));
					on.once(window, transitionEnd, lang.hitch(this, function(e) {
						completeAnimation();
					}));
				} else {
					setTimeout(completeAnimation,anim.duration);
				}
				setTimeout(fn, 0);
			} else {
				fn();
				is(anim.complete, "Function") && anim.complete();
				is(callback, "Function") && callback();
			}
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
		
		_measuredWidth: 0,
		
		_measuredHeight: 0,
		
		_measuredSandboxWidth: 0,
		
		_measuredSandboxHeight: 0,
		
		constants: {
			size: {
				get: function() {
					return {
						x: 0,
						y: 0,
						width: this._measuredWidth,
						height: this._measuredHeight
					};
				}
			},
			rect: {
				get: function() {
					return {
						x: this._measuredTop,
						y: this._measuredLeft,
						width: this._measuredWidth,
						height: this._measuredHeight
					};
				}
			},
			parent: function() {
				return this._parent;
			}
		},

		properties: {
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundGradient: {
				set: function(value, oldValue) {
					
					// Type and colors are required
					if (!is(value.type,"String") || !is(value.colors,"Array") || value.colors.length < 2) {
						return;
					}
					
					// Vet the type and assign default values
					var type = value.type,
						startPoint = value.startPoint,
						endPoint = value.endPoint;
					if (type === "linear") {
						if (!startPoint || !("x" in startPoint) || !("y" in startPoint)) {
							value.startPoint = {
								x: "0%",
								y: "50%"
							}
						}
						if (!endPoint || !("x" in endPoint) || !("y" in endPoint)) {
							value.endPoint = {
								x: "100%",
								y: "50%"
							}
						}
					} else if (type === "radial") {
						if (!startPoint || !("x" in startPoint) || !("y" in startPoint)) {
							value.startPoint = {
								x: "50%",
								y: "50%"
							}
						}
					} else {
						return;
					}
					return value;
				},
				post: function() {
					this.backgroundGradient && this._computeGradient();
				}
			},

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,

			borderColor: {
				set: function(value) {
					setStyle(this.domNode, "borderColor", value);
					return value;
				}
			},

			borderRadius: {
				set: function(value) {
					setStyle(this.domNode, "borderRadius", unitize(value));
					return value;
				},
				value: 0
			},

			borderWidth: {
				set: function(value, oldValue) {
					
					if (is(value,"Array")) {
						if (value.length !== 4) {
							return oldValue;
						}
						setStyle(this.domNode, {
							borderLeftWidth: (this._borderLeftWidth = value[0]) + pixelUnits,
							borderRightWidth: (this._borderRightWidth = value[1]) + pixelUnits,
							borderTopWidth: (this._borderTopWidth = value[2]) + pixelUnits,
							borderBottomWidth: (this._borderBottomWidth = value[3]) + pixelUnits
						});
						this._borderSet = true;
					} else if(isNaN(value)) {
						return oldValue;
					} else {
						setStyle(this.domNode, "borderWidth", value + pixelUnits);
						this._borderLeftWidth = this._borderRightWidth = this._borderTopWidth = this._borderBottomWidth = value;
						this._borderSet = true;
					}
					return value;
				},
				post: postLayoutPropFunction,
				value: 0
			},

			bottom: postLayoutProp,

			center: postLayoutProp,

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
					dom.attr[value ? "set" : "remove"](this._focus.node, "tabindex", 0);
					return value;
				}
			},

			_minHeight: postLayoutProp,

			_maxHeight: postLayoutProp,

			height: postLayoutProp,

			left: postLayoutProp,

			opacity: {
				set: function(value) {
					return setStyle(this.domNode, "opacity", value);
				}
			},

			visible: {
				set: function(value, orig) {
					if (value !== orig) {
						!value && (this._lastDisplay = style.get(this.domNode, "display"));
						setStyle(this.domNode, "display", !!value ? this._lastDisplay || "" : "none");
						!!value && this._triggerLayout();
					}
					return value;
				}
			},

			right: postLayoutProp,

			touchEnabled: {
				set: function(value) {
					this._setTouchEnabled(value);
					return value;
				},
				value: true
			},

			top: postLayoutProp,

			transform: {
				set: function(value) {
					setStyle(this.domNode, "transform", value.toCSS());
					return this._curTransform = value;
				}
			},

			_minWidth: postLayoutProp,

			_maxWidth: postLayoutProp,

			width: postLayoutProp,

			zIndex: postLayoutProp
		}

	});

});