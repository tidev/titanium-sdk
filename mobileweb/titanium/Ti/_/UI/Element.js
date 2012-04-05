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
		postLayoutProp = {
			set: function(value, oldValue) {
				if (value !== oldValue) {
					!this._batchUpdateInProgress && this._triggerLayout();
				}
				return value;
			}
		};

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

			// TODO: mixin JSS rules (http://jira.appcelerator.org/browse/TIMOB-6780)
			var values = this.constants.__values__;
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
			view._hasBeenLaidOut = false;
			this._triggerLayout(this._isAttachedToActiveWin());
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
		
		_markedForLayout: false,
		
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
		
		_triggerLayout: function(force) {
			this._isAttachedToActiveWin() && (!this._batchUpdateInProgress || force) && UI._triggerLayout(this, force);
		},
		
		_getInheritedWidth: function() {
			var parent = this._parent,
				parentWidth;
			if (parent) {
				parentWidth = lang.val(parent.width,parent._defaultWidth);
				return parentWidth === UI.INHERIT ? parent._getInheritedWidth() : parentWidth;
			}
		},
		
		_getInheritedHeight: function(node) {
			var parent = this._parent,
				parentHeight;
			if (parent) {
				parentHeight = lang.val(parent.height,parent._defaultHeight);
				return parentHeight === UI.INHERIT ? parent._getInheritedHeight() : parentHeight;
			}
		},
		
		_hasSizeDimensions: function() {
			var width = this._getInheritedWidth(),
				height = this._getInheritedHeight()
			return (this._width === UI.SIZE || width === UI.SIZE) || 
				(this._height === UI.SIZE || height === UI.SIZE);
		},
		
		_hasFillWidth: function() {
			var width = this.width;
			if (isDef(width)) {
				if (width === UI.INHERIT) {
					return this._getInheritedWidth() === UI.FILL;
				}
				return width === UI.FILL;
			}
			if (isDef(this.left) + isDef(this.right) + !!(this.center && isDef(this.center.x)) > 1) {
				return false;
			}
			if (this._defaultWidth === UI.FILL) {
				return true;
			}
			if (this._defaultWidth === UI.INHERIT) {
				return this._getInheritedWidth() === UI.FILL;
			}
		},
		
		_hasFillHeight: function() {
			var height = this.height;
			if (isDef(height)) {
				if (height === UI.INHERIT) {
					return this._getInheritedHeight() === UI.FILL;
				}
				return height === UI.FILL;
			}
			if (isDef(this.top) + isDef(this.bottom) + !!(this.center && isDef(this.center.y)) > 1) {
				return false;
			}
			if (this._defaultHeight === UI.FILL) {
				return true;
			}
			if (this._defaultHeight === UI.INHERIT) {
				return this._getInheritedHeight() === UI.FILL;
			}
		},
		
		_hasBeenLaidOut: false,
		
		_isDependentOnParent: function(){
			function isPercent(value) {
				return /%$/.test("" + value);
			}
			var centerX = this.center && this.center.x,
				centerY = this.center && this.center.y,
				width = this._getInheritedWidth(),
				height = this._getInheritedHeight();
			return !!(isPercent(width) || isPercent(height) || isPercent(this.top) || isPercent(this.bottom) || 
				isPercent(this.left) || isPercent(this.right) || isPercent(centerX) || isPercent(centerY) || 
				this._hasFillWidth() || this._hasFillHeight() ||
				(!isDef(this.left) && !isDef(centerX) && !isDef(this.right) && this._parent && this._parent._layout._defaultHorizontalAlignment !== "left") ||
				(!isDef(this.top) && !isDef(centerY) && !isDef(this.bottom) && this._parent && this._parent._layout._defaultVerticalAlignment !== "top"));
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
		
		_layoutParams: {
		 	origin: {
		 		x: 0,
		 		y: 0
		 	},
		 	isParentSize: {
		 		width: 0,
		 		height: 0
		 	},
		 	boundingSize: {
		 		width: 0,
		 		height: 0
		 	},
		 	alignment: {
		 		horizontal: "center",
		 		vertical: "center"
		 	}
	 	},

		_doLayout: function(params) {
			
			this._layoutParams = params;
			
			var dimensions = this._computeDimensions({
					layoutParams: params,
					position: {
						left: this.left,
						top: this.top,
						right: this.right,
						bottom: this.bottom,
						center: this.center
					},
					size: {
						width: this.width,
						height: this.height
					},
					layoutChildren: params.layoutChildren
				});
				
			if (params.positionElement) {
				UI._elementLayoutCount++;
				
				// Set and store the dimensions
				var styles = {
					zIndex: this.zIndex | 0
				};
				styles.left = unitize(this._measuredLeft = dimensions.left);
				styles.top = unitize(this._measuredTop = dimensions.top);
				styles.width = unitize(this._measuredWidth = dimensions.width);
				styles.height = unitize(this._measuredHeight = dimensions.height);
				this._measuredRightPadding = dimensions.rightPadding;
				this._measuredBottomPadding = dimensions.bottomPadding;
				this._measuredBorderSize = dimensions.borderSize;
				this._measuredEffectiveWidth = dimensions.effectiveWidth;
				this._measuredEffectiveHeight = dimensions.effectiveHeight;
				setStyle(this.domNode, styles);
			
				this._markedForLayout = false;
				this._hasBeenLaidOut = true;
				
				// Recompute the gradient, if it exists
				this.backgroundGradient && this._computeGradient();
				
				this.fireEvent("postlayout");
			}
			
			return dimensions;
		},

		_computeDimensions: function(params) {
			
			var layoutParams = params.layoutParams,
				boundingWidth = layoutParams.boundingSize.width,
				boundingHeight = layoutParams.boundingSize.height,
				position = params.position,
				size  = params.size,
				
				// Compute as many sizes as possible, should be everything except SIZE values for width and height and undefined values
				left = computeSize(position.left, boundingWidth, 1),
				top = computeSize(position.top, boundingHeight, 1),
				originalRight = computeSize(position.right, boundingWidth),
				originalBottom = computeSize(position.bottom, boundingHeight),
				centerX = position.center && computeSize(position.center.x, boundingWidth, 1),
				centerY = position.center && computeSize(position.center.y, boundingHeight, 1),
				width = computeSize(size.width === UI.INHERIT ? this._getInheritedWidth() : size.width, boundingWidth),
				height = computeSize(size.height === UI.INHERIT ? this._getInheritedHeight() : size.height, boundingHeight),

				// Convert right/bottom coordinates to be with respect to (0,0)
				right = layoutParams.rightIsMargin ? void 0 : isDef(originalRight) ? (boundingWidth - originalRight) : void 0,
				bottom = layoutParams.bottomIsMargin ? void 0 : isDef(originalBottom) ? (boundingHeight - originalBottom) : void 0,
				
				// Calculate the "padding"
				rightPadding = is(originalRight,"Number") ? originalRight : 0,
				bottomPadding = is(originalBottom,"Number") ? originalBottom : 0,
				origin = layoutParams.origin;
			
			is(width,"Number") && (width = Math.max(width,0));
			is(height,"Number") && (height = Math.max(height,0));

			// Unfortunately css precidence doesn't match the titanium, so we have to handle precedence and default setting ourselves
			var defaultWidth = this._defaultWidth;
			if (isDef(width)) {
				if (isDef(left)) {
					right = void 0;
				} else if (isDef(centerX)){
					if (width === UI.SIZE) {
						left = "calculateDefault";
					} else {
						left = centerX - width / 2;
						right = void 0;
					}
				} else if (!isDef(right)){
					// Set the default position
					left = "calculateDefault";
				}
			} else {
				if (isDef(centerX)) {
					if (isDef(left)) {
						width = (centerX - left) * 2;
						right = void 0;
					} else if (isDef(right)) {
						width = (right - centerX) * 2;
					} else {
						// Set the default width
						width = computeSize(defaultWidth === UI.INHERIT ? this._getInheritedWidth() : defaultWidth, boundingWidth);
					}
				} else {
					if (!isDef(left) || !isDef(right)) {
						width = computeSize(defaultWidth === UI.INHERIT ? this._getInheritedWidth() : defaultWidth, boundingWidth);
						if(!isDef(left) && !isDef(right)) {
							// Set the default position
							left = "calculateDefault";
						}
					}
				}
			}
			var defaultHeight = this._defaultHeight;
			if (isDef(height)) {
				if (isDef(top)) {
					bottom = void 0;
				} else if (isDef(centerY)){
					if(height === UI.SIZE) {
						top = "calculateDefault";
					} else {
						top = centerY - height / 2;
						bottom = void 0;
					}
				} else if (!isDef(bottom)) {
					// Set the default position
					top = "calculateDefault";
				}
			} else {
				if (isDef(centerY)) {
					if (isDef(top)) {
						height = (centerY - top) * 2;
						bottom = void 0;
					} else if (isDef(bottom)) {
						height = (bottom - centerY) * 2;
					} else {
						// Set the default height
						height = computeSize(defaultHeight === UI.INHERIT ? this._getInheritedHeight() : defaultHeight, boundingHeight);
					}
				} else {
					if (!isDef(top) || !isDef(bottom)) {
						// Set the default height
						height = computeSize(defaultHeight === UI.INHERIT ? this._getInheritedHeight() : defaultHeight, boundingHeight);
						if(!isDef(top) && !isDef(bottom)) {
							// Set the default position
							top = "calculateDefault";
						}
					}
				}
			}
			
			// Calculate the border
			function getValue(value) {
				var value = parseInt(computedStyle[value]);
				return isNaN(value) ? 0 : value;
			}
					
			var computedStyle = window.getComputedStyle(this.domNode),
				borderSize = {
					left: getValue("border-left-width") + getValue("padding-left"),
					top: getValue("border-top-width") + getValue("padding-top"),
					right: getValue("border-right-width") + getValue("padding-right"),
					bottom: getValue("border-bottom-width") + getValue("padding-bottom")
				};
				
			function constrainValue(value, minValue, maxValue) {
				return (isDef(minValue) && minValue > value ? minValue : // Apply the min width 
					isDef(maxValue) && maxValue < value ? maxValue : value); // Apply the max width
			}

			// Calculate the width/left properties if width is NOT SIZE
			var calculateWidthAfterChildren = false,
				calculateHeightAfterChildren = false;
			if (width === UI.SIZE) {
				calculateWidthAfterChildren = true;
			} else {
				if (width === UI.FILL) {
					if (isDef(left)) {
						left === "calculateDefault" && (left = 0);
						width = boundingWidth - left - rightPadding;
					} else if (isDef(right)) {
						width = right;
					}
				} else if (isDef(right)) {
					if (isDef(left)) {
						width = right - left;
					} else {
						left = right - width;
					}
				}
				width = constrainValue(width, this._minWidth, this._maxWidth) - borderSize.left - borderSize.right;
			}
			if (height === UI.SIZE) {
				calculateHeightAfterChildren = true;
			} else {
				if (height === UI.FILL) {
					if (isDef(top)) {
						top === "calculateDefault" && (top = 0);
						height = boundingHeight - top - bottomPadding;
					} else if (isDef(bottom)) {
						height = bottom;
					}
				} else if (isDef(bottom)) {
					if (isDef(top)) {
						height = bottom - top;
					} else {
						top = bottom - height;
					}
				}
				height = constrainValue(height, this._minHeight, this._maxHeight) - borderSize.top - borderSize.bottom;
			}

			if (this._getContentSize) {
				var contentSize = this._getContentSize();
				width === UI.SIZE && (width = contentSize.width);
				height === UI.SIZE && (height = contentSize.height);
			} else {
				var computedSize;
				if (params.layoutChildren) {
					computedSize = this._layout._doLayout(this,is(width,"Number") ? width : boundingWidth,is(height,"Number") ? height : boundingHeight, !is(width,"Number"), !is(height,"Number"));
				} else {
					computedSize = this._layout._computedSize;
				}
				width === UI.SIZE && (width = constrainValue(computedSize.width, this._minWidth, this._maxWidth));
				height === UI.SIZE && (height = constrainValue(computedSize.height, this._minHeight, this._maxHeight));
			}
			
			if (calculateWidthAfterChildren) {
				if (isDef(right) && !isDef(left)) {
					left = right - width;
				}
			}
			if (calculateHeightAfterChildren) {
				if (isDef(bottom) && !isDef(top)) {
					top = bottom - height;
				}
			}

			// Set the default top/left if need be
			if (left === "calculateDefault") {
				if (!layoutParams.isParentSize.width) {
					switch(layoutParams.alignment.horizontal) {
						case "center": left = computeSize("50%",boundingWidth) - borderSize.left - (is(width,"Number") ? width : 0) / 2; break;
						case "right": left = boundingWidth - borderSize.left - borderSize.right - (is(width,"Number") ? width : 0) / 2; break;
						default: left = 0; // left
					}
				} else {
					left = 0;
				}
			}
			if (top === "calculateDefault") {
				if (!layoutParams.isParentSize.height) {
					switch(layoutParams.alignment.vertical) {
						case "center": top = computeSize("50%",boundingHeight) - borderSize.top - (is(height,"Number") ? height : 0) / 2; break;
						case "bottom": top = boundingWidth - borderSize.top - borderSize.bottom - (is(height,"Number") ? height : 0) / 2; break;
						default: top = 0; // top
					}
				} else {
					top = 0;
				}
			}
			
			return {
				effectiveWidth: left + width + rightPadding + borderSize.left + borderSize.right,
				effectiveHeight: top + height + bottomPadding + borderSize.top + borderSize.bottom,
				left: Math.round(left + origin.x),
				top: Math.round(top + origin.y),
				rightPadding: Math.round(rightPadding),
				bottomPadding: Math.round(bottomPadding),
				width: Math.round(Math.max(width,0)),
				height: Math.round(Math.max(height,0)),
				borderSize: borderSize
			};
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
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * color.offset + "%", userGradientEnd - userGradientStart) + userGradientStart) + "px";
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
				
				cssVal += startPointX + "px " + startPointY + "px";
				
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
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * offset + "%", endRadius - startRadius) + startRadius) + "px";
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
				// Create the transition, must be set before setting the other properties
				setStyle(this.domNode, "transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));
				on.once(window, transitionEnd, lang.hitch(this, function(e) {
					if (!this._destroyed) {
						// Clear the transform so future modifications in these areas are not animated
						setStyle(this.domNode, "transition", "");
						is(anim.complete, "Function") && anim.complete();
						is(callback, "Function") && callback();
					}
				}));
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
		_measuredRightPadding: 0,
		_measuredBottomPadding: 0,
		_measuredWidth: 0,
		_measuredHeight: 0,
		_measuredBorderSize: {
			value: {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			}
		},
		
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
				set: function(value) {
					setStyle(this.domNode, "borderWidth", unitize(value));
					return value;
				},
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