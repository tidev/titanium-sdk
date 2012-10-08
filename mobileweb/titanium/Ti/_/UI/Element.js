define(
	["Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang",
	"Ti/_/style", "Ti/_/Evented", "Ti/UI", "Ti/UI/Animation"],
	function(css, declare, dom, event, lang, style, Evented, UI, Animation) {

	var global = window,
		unitize = dom.unitize,
		computeSize = dom.computeSize,
		on = require.on,
		setStyle = style.set,
		is = require.is,
		postDoBackground = {
			post: "_doBackground"
		},
		postLayoutPropFunction = function(value, oldValue) {
			(value === null || (!is(value,"String") && !is(value,"Number"))) && (value = void 0);
			value !== oldValue && !this._batchUpdateInProgress && this._triggerLayout();
			return value;
		},
		postLayoutProp = {
			set: postLayoutPropFunction
		},
		pixelUnits = "px",
		gestureMapping = {
			pinch: "Pinch",
			swipe: "Swipe",
			twofingertap: "TwoFingerTap",
			doubletap: "DoubleTap",
			longpress: "LongPress",
			singletap: "SingleTap",
			click: "SingleTap",
			dragging: "Dragging",
			doubleclick: "DoubleTap",
			touchstart: "TouchStart",
			touchend: "TouchEnd",
			touchmove: "TouchMove",
			touchcancel: "TouchCancel"
		};

	return declare("Ti._.UI.Element", Evented, {

		domType: null,
		domNode: null,
		_alive: 1,

		constructor: function(args) {
			var self = this,
				touchMoveBlocked = false,

				node = this.domNode = this._setFocusNode(dom.create(this.domType || "div", {
					className: "TiUIElement " + css.clean(this.declaredClass),
					"data-widget-id": this.widgetId
				})),

				// Handle click/touch/gestures
				recognizers = this._gestureRecognizers = {},

				useTouch = "ontouchstart" in global;

			function processTouchEvent(eventType, evt) {
				var i,
					touches = evt.changedTouches;
				if (!self._preventDefaultTouchEvent) {
					evt.skipPreventDefault = 1;
				} else if (!evt.skipPreventDefault) {
					evt.preventDefault && evt.preventDefault();
					for (i in touches) {
						touches[i].preventDefault && touches[i].preventDefault();
					}
				}
				useTouch || require.mix(evt, {
					touches: evt.type === "mouseup" ? [] : [evt],
					targetTouches: [],
					changedTouches: [evt]
				});
				for (i in recognizers) {
					recognizers[i].recognizer["process" + eventType](evt, self);
				}
				for (i in recognizers) {
					recognizers[i].recognizer["finalize" + eventType]();
				}
			}

			this._touching = false;

			this._children = [];

			this._disconnectTouchEvent = on(this.domNode, useTouch ? "touchstart" : "mousedown", function(evt){
				var handles = [
					on(global, useTouch ? "touchmove" : "mousemove", function(evt){
						if (!touchMoveBlocked) {
							touchMoveBlocked = true;
							(useTouch || self._touching) && processTouchEvent("TouchMoveEvent", evt);
							setTimeout(function(){
								touchMoveBlocked = false;
							}, 30);
						}
					}),
					on(global, useTouch ? "touchend" : "mouseup", function(evt){
						self._touching = false;
						processTouchEvent("TouchEndEvent", evt);
						event.off(handles);
					}),
					useTouch && on(global, "touchcancel", function(evt){
						processTouchEvent("TouchCancelEvent", evt);
						event.off(handles);
					})
				];
				self._touching = true;
				processTouchEvent("TouchStartEvent", evt);
			});

			on(this, "touchstart", this, "_doBackground");
			on(this, "touchend", this, "_doBackground");

			var values = this.constants.__values__;
			this._layoutCoefficients = {
				width: {
					x1: 0,
					x2: 0,
					x3: 0
				},
				minWidth: {
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
				minHeight: {
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

		addEventListener: function(name, handler) {
			if (name in gestureMapping) {
				var gestureRecognizers = this._gestureRecognizers,
					gestureRecognizer;
				
				if (!(name in gestureRecognizers)) {
					gestureRecognizers[name] = {
						count: 0,
						recognizer: new (require("Ti/_/Gestures/" + gestureMapping[name]))(name)
					};
				}
				
				gestureRecognizers[name].count++;
			}
			handler && Evented.addEventListener.apply(this, arguments);
		},

		removeEventListener: function(name) {
			if (name in gestureMapping) {
				var gestureRecognizers = this._gestureRecognizers;
				if (name in gestureRecognizers && !(--gestureRecognizers[name].count)) {
					delete gestureRecognizers[name];
				}
			}
			Evented.removeEventListener.apply(this, arguments);
		},

		_setParent: function(view) {
			this._parent = view;
		},

		_add: function(view, hidden) {

			view._hidden = hidden;

			view._setParent(this);

			this._children.push(view);
			this.containerNode.appendChild(view.domNode);

			view._triggerLayout();
		},

		_insertAt: function(view, index, hidden) {
			var children = this._children;
			if (index > children.length || index < 0) {
				return;
			} else if (index === children.length) {
				this._add(view, hidden);
			} else {
				view._parent = this;
				this.containerNode.insertBefore(view.domNode, children[index].domNode);
				children.splice(index,0,view);
				this._triggerLayout();
			}
		},

		_remove: function(view) {
			var children = this._children,
				p = children.indexOf(view);
			if (p !== -1) {
				children.splice(p, 1);
				view._setParent();
				dom.detach(view.domNode);
				this._triggerLayout();
			}
		},

		_removeAllChildren: function(view) {
			var children = this._children;
			while (children.length) {
				this.remove(children[0]);
			}
			this._triggerLayout();
		},

		destroy: function() {
			if (this._alive) {
				var children = this._children;
				this._disconnectTouchEvent();
				while (children.length) {
					children.splice(0, 1)[0].destroy();
				}
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
			return this._hasSizeWidth() || this._hasSizeHeight();
		},
		
		_hasSizeHeight: function() {
			return isNaN(this._layoutCoefficients.height.x1);
		},
		
		_hasSizeWidth: function() {
			return isNaN(this._layoutCoefficients.width.x1);
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
			var i = 0,
				len = params.length;
			for(; i < len; i++) {
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
			return getAbsolutePosition(destinationView, getAbsolutePosition(this,point,true),false);
		},

		// This method returns the offset of the content relative to the parent's location. 
		// This is useful for controls like ScrollView that can move the children around relative to itself.
		_getContentOffset: function() {
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

			require.config.vendorPrefixes.css.forEach(function(vendorPrefix) {
				setStyle(this.domNode, "backgroundImage", vendorPrefix + cssVal + ")");
			}, this);
		},

		_preventDefaultTouchEvent: true,

		_isGestureBlocked: function(gesture) {
			var recognizer,
				blockedGestures,
				blockedGesture;
			for (recognizer in this._gestureRecognizers) {
				blockedGestures = this._gestureRecognizers[recognizer].blocking;
				for (blockedGesture in blockedGestures) {
					if (gesture === blockedGestures[blockedGesture]) {
						return true;
					}
				}
			}
			return false;
		},

		_handleTouchEvent: function(type, e) {
			if (this.enabled) {
				// Normalize the location of the event.
				var pt, x, y;
				if (is(e.x, "Number") && is(e.y, "Number")) {
					pt = UI._container.convertPointToView({
						x: e.x,
						y: e.y
					}, e.source || this) || {};
					x = pt.x;
					y = pt.y;
				}
				e.x = x;
				e.y = y;
				this.fireEvent(type, e);
			}
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
		
		_getBorderFromCSS: function() {
			setTimeout(lang.hitch(this, function () {
				var computedStyle = global.getComputedStyle(this.domNode),
					left = parseInt(computedStyle["border-left-width"]),
					right = parseInt(computedStyle["border-right-width"]),
					top = parseInt(computedStyle["border-top-width"]),
					bottom = parseInt(computedStyle["border-bottom-width"]);
				
				if (!(isNaN(left) || isNaN(right) || isNaN(top) || isNaN(bottom))) {
						if (left === right && left === top && left === bottom) {
							this.borderWidth = left;
						} else {
							this.borderWidth = [left, right, top, bottom];
						}
				}
			}), 1);
		},

		_doBackground: function(evt) {
			if (!this.backgroundGradient) {
				var evt = evt || {},
					m = (evt.type || "").match(/mouse(over|out)/),
					bi = this.backgroundImage || this._defaultBackgroundImage || "none",
					bc = this.backgroundColor || this._defaultBackgroundColor,
					repeat = this.backgroundRepeat,
					nodeStyle = this.domNode.style,
					tmp;

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

				bc = bc || (bi && bi !== "none" ? "transparent" : "");
				nodeStyle.backgroundColor.toLowerCase() !== bc.toLowerCase() && (nodeStyle.backgroundColor = bc);

				bi = style.url(bi);
				nodeStyle.backgroundImage.replace(/'|"/g, '').toLowerCase() !== bi.toLowerCase() && (nodeStyle.backgroundImage = bi);

				if (bi) {
					tmp = repeat ? "repeat" : "no-repeat";
					nodeStyle.backgroundRepeat !== tmp && (nodeStyle.backgroundRepeat = tmp);
					tmp = repeat ? "auto" : "100% 100%";
					nodeStyle.backgroundSize.replace(/(100%) 100%/, "$1") !== tmp && (nodeStyle.backgroundSize = tmp);
				}
			}
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
					on(node, "blur", this, "_doBackground")
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
			return this._isAttachedToActiveWin() && Animation._play(this, anim && anim.declaredClass === "Ti.UI.Animation" ? anim : new Animation(anim)).then(callback);
		},

		_setTouchEnabled: function(value) {
			var children = this._children,
				child,
				i = 0,
				len = children.length;
			setStyle(this.domNode, "pointerEvents", value ? "auto" : "none");
			for (; i < len; i++) {
				child = children[i];
				child._setTouchEnabled(value && child.touchEnabled);
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
						x: this._measuredLeft,
						y: this._measuredTop,
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

			backgroundRepeat: postDoBackground,

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
					value = !!value;
					if (value !== orig) {
						!value && (this._lastDisplay = style.get(this.domNode, "display"));
						setStyle(this.domNode, "display", !!value ? this._lastDisplay || "" : "none");
						value && orig !== void 0 && this._triggerLayout();
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
					setStyle(this.domNode, "transform", value && value.toCSS());
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