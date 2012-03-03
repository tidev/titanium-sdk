define(
	["Ti/_/browser", "Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/style", "Ti/_/Evented",
	"Ti/UI", "Ti/_/Gestures/DoubleTap","Ti/_/Gestures/LongPress","Ti/_/Gestures/Pinch","Ti/_/Gestures/SingleTap",
	"Ti/_/Gestures/Swipe","Ti/_/Gestures/TouchCancel","Ti/_/Gestures/TouchEnd","Ti/_/Gestures/TouchMove",
	"Ti/_/Gestures/TouchStart","Ti/_/Gestures/TwoFingerTap"],
	function(browser, css, declare, dom, event, lang, style, Evented, UI,
		DoubleTap, LongPress, Pinch, SingleTap, Swipe, TouchCancel, TouchEnd, TouchMove, TouchStart, TwoFingerTap) {

	var undef,
		unitize = dom.unitize,
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
			post: function() {
				this._parent && this._parent._triggerLayout();
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

		destroy: function() {
			if (this._alive) {
				this.parent && this.parent.remove(this);
				if (this.domNode) {
					dom.destroy(this.domNode);
					this.domNode = null;
				}
			}
			Evented.destroy.apply(this, arguments);
		},
		
		_markedForLayout: false,
		
		_triggerLayout: function(force) {
			
			if (this._markedForLayout && !force) {
				return;
			}
			
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
			if (!isAttachedToActiveWin) {
				return;
			}
			
			// Find the top most node that needs to be layed out.
			var rootLayoutNode = this;
			while(rootLayoutNode._parent != null && rootLayoutNode._hasSizeDimensions()) {
				rootLayoutNode = rootLayoutNode._parent;
			}
			rootLayoutNode._markedForLayout = true;
			
			// Let the UI know that a layout needs to be performed if this is not part of a batch update
			(!this._batchUpdateInProgress || force) && UI._triggerLayout(force);
		},
		
		_triggerParentLayout: function() {
			this._parent && this._parent._triggerLayout();
		},
		
		_hasSizeDimensions: function() {
			return (this.width === Ti.UI.SIZE || (!isDef(this.width) && this._defaultWidth === Ti.UI.SIZE)) || 
				(this.height === Ti.UI.SIZE || (!isDef(this.height) && this._defaultHeight === Ti.UI.SIZE));
		},
		
		startLayout: function() {
			this._batchUpdateInProgress = true;
		},
		
		finishLayout: function() {
			this._batchUpdateInProgress = false;
			UI._triggerLayout(true);
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
					layoutChildren: true
				});

			// Set and store the dimensions
			var styles = {
					zIndex: this.zIndex | 0
				},
				rect  = this.rect,
				size  = this.size;
			rect.x = this._measuredLeft = dimensions.left;
			isDef(this._measuredLeft) && (styles.left = unitize(this._measuredLeft));
			rect.y = this._measuredTop = dimensions.top;
			isDef(this._measuredTop) && (styles.top = unitize(this._measuredTop));
			size.width = rect.width = this._measuredWidth = dimensions.width;
			isDef(this._measuredWidth) && (styles.width = unitize(this._measuredWidth));
			size.height = rect.height = this._measuredHeight = dimensions.height;
			isDef(this._measuredHeight) && (styles.height = unitize(this._measuredHeight));
			this._measuredRightPadding = dimensions.rightPadding;
			this._measuredBottomPadding = dimensions.bottomPadding;
			this._measuredBorderSize = dimensions.borderSize;
			setStyle(this.domNode, styles);
			
			try{
				var computedStyle = window.getComputedStyle(this.domNode);
				if (styles.left && computedStyle["left"] != styles.left) {
					throw "Invalid layout";
				}
				if (styles.top && computedStyle["top"] != styles.top) {
					throw "Invalid layout";
				}
				if (styles.width && computedStyle["width"] != styles.width) {
					throw "Invalid layout";
				}
				if (styles.height && computedStyle["height"] != styles.height) {
					throw "Invalid layout";
				}
			} catch(e) {}
			
			this._markedForLayout = false;
			
			// Run the post-layout animation, if needed
			if (this._doAnimationAfterLayout) {
				this._doAnimationAfterLayout = false;
				this._doAnimation();
			}
			
			// Recompute the gradient, if it exists
			this.backgroundGradient && this._computeGradient();
			
			this.fireEvent("postlayout");
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
				width = computeSize(size.width, boundingWidth),
				height = computeSize(size.height, boundingHeight),

				// Convert right/bottom coordinates to be with respect to (0,0)
				right = isDef(originalRight) ? (boundingWidth - originalRight) : undef,
				bottom = isDef(originalBottom) ? (boundingHeight - originalBottom) : undef;
			
			is(width,"Number") && (width = Math.max(width,0));
			is(height,"Number") && (height = Math.max(height,0));
				
			function validate() {
				try{
					if(is(left,"Number") && isNaN(left) || 
						is(top,"Number") && isNaN(top) || 
						is(width,"Number") && (isNaN(width) || width < 0) || 
						is(height,"Number") && (isNaN(height) || height < 0)) {
					 	throw "Invalid layout";
					}
				} catch(e) {}
			}
			validate();

			// Unfortunately css precidence doesn't match the titanium, so we have to handle precedence and default setting ourselves
			if (isDef(width)) {
				if (isDef(left)) {
					right = undef;
				} else if (isDef(centerX)){
					if (width === Ti.UI.SIZE) {
						left = "calculateDefault";
					} else {
						left = centerX - width / 2;
						right = undef;
					}
				} else if (isDef(right)) {
					// Do nothing
				} else {
					// Set the default position
					left = "calculateDefault";
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
						width = computeSize(this._defaultWidth,boundingWidth);
					}
				} else {
					if (isDef(left) && isDef(right)) {
						// Do nothing
					} else {
						width = computeSize(this._defaultWidth,boundingWidth);
						if(!isDef(left) && !isDef(right)) {
							// Set the default position
							left = "calculateDefault";
						}
					}
				}
			}
			if (isDef(height)) {
				if (isDef(top)) {
					bottom = undef;
				} else if (isDef(centerY)){
					if(height === Ti.UI.SIZE) {
						top = "calculateDefault";
					} else {
						top = centerY - height / 2;
						bottom = undef;
					}
				} else if (isDef(bottom)) {
					// Do nothing
				} else {
					// Set the default position
					top = "calculateDefault";
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
						height = computeSize(this._defaultHeight,boundingHeight);
					}
				} else {
					if (isDef(top) && isDef(bottom)) {
						// Do nothing
					} else {
						// Set the default height
						height = computeSize(this._defaultHeight,boundingHeight);
						if(!isDef(top) && !isDef(bottom)) {
							// Set the default position
							top = "calculateDefault";
						}
					}
				}
			}
			validate();
			
			function getBorderSize() {
				
				function getValue(value) {
					var value = parseInt(computedStyle[value]);
					return isNaN(value) ? 0 : value;
				}
					
				return {
					left: getValue("border-left-width") + getValue("padding-left"),
					top: getValue("border-top-width") + getValue("padding-top"),
					right: getValue("border-right-width") + getValue("padding-right"),
					bottom: getValue("border-bottom-width") + getValue("padding-bottom")
				};
			}
			
			// Calculate the border
			var computedStyle = window.getComputedStyle(this.domNode);
				borderSize = getBorderSize();

			// Calculate the width/left properties if width is NOT SIZE
			var calculateWidthAfterChildren = false,
				calculateHeightAfterChildren = false;
			if (width !== Ti.UI.SIZE) {
				if (isDef(right)) {
					if (isDef(left)) {
						width = right - left;
					} else {
						left = right - width;
					}
				}
				width -= borderSize.left + borderSize.right;
			} else {
				calculateWidthAfterChildren = true;
			}
			if (height !== Ti.UI.SIZE) {
				if (isDef(bottom)) {
					if (isDef(top)) {
						height = bottom - top;
					} else {
						top = bottom - height;
					}
				}
				height -= borderSize.top + borderSize.bottom;
			} else {
				calculateHeightAfterChildren = true;
			}
			validate();

			if (this._getContentSize) {
				var contentSize = this._getContentSize();
				width === Ti.UI.SIZE && (width = contentSize.width);
				height === Ti.UI.SIZE && (height = contentSize.height);
			} else {
				var computedSize;
				if (params.layoutChildren) {
					computedSize = this._layout._doLayout(this,is(width,"Number") ? width : boundingWidth,is(height,"Number") ? height : boundingHeight, !is(width,"Number"), !is(height,"Number"));
				} else {
					computedSize = this._layout._computedSize;
				}
				width === Ti.UI.SIZE && (width = computedSize.width);
				height === Ti.UI.SIZE && (height = computedSize.height);
			}
			validate();
			
			// I have no idea why we have to recalculate, but for some reason the recursion is screwing with the values.
			borderSize = getBorderSize();
			
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
			validate();

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
			validate();
			
			// Calculate the "padding" and apply the origin
			var leftPadding = left,
				topPadding = top,
				rightPadding = is(originalRight,"Number") ? originalRight : 0,
				bottomPadding = is(originalBottom,"Number") ? originalBottom : 0,
				origin = layoutParams.origin;
			left += origin.x;
			top += origin.y;

			if(!is(left,"Number") || isNaN(left) || 
				!is(top,"Number") || isNaN(top) || 
				!is(rightPadding,"Number") || isNaN(rightPadding) || 
				!is(bottomPadding,"Number") || isNaN(bottomPadding) || 
				!is(width,"Number") || isNaN(width) || 
				!is(height,"Number") || isNaN(height)) {
			 	try{
			 		throw "Invalid layout";
			 	} catch(e) {}
			}
			
			return {
				left: Math.round(left),
				top: Math.round(top),
				rightPadding: Math.round(rightPadding),
				bottomPadding: Math.round(bottomPadding),
				width: Math.round(Math.max(width,0)),
				height: Math.round(Math.max(height,0)),
				borderSize: borderSize
			};
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
		
		_defaultBackgroundColor: undef,
		
		_defaultBackgroundImage: undef,
		
		_defaultBackgroundDisabledColor: undef,
		
		_defaultBackgroundDisabledImage: undef,
		
		_defaultBackgroundFocusedColor: undef,
		
		_defaultBackgroundFocusedImage: undef,
		
		_defaultBackgroundSelectedColor: undef,
		
		_defaultBackgroundSelectedImage: undef,

		_doBackground: function(evt) {
			var evt = evt || {},
				m = (evt.type || "").match(/mouse(over|out)/),
				node = this._focus.node,
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
			//this.fireEvent("ti:shown");
		},

		hide: function() {
			this.visible = false;
			//obj.fireEvent("ti:hidden");
		},

		animate: function(anim, callback) {
			this._animationData = anim;
			this._animationCallback = callback;
			
			if (UI._layoutInProgress) {
				this._doAnimationAfterLayout = true;
			} else {
				this._doAnimation();
			}
		},
		
		_doAnimation: function() {
			
			var anim = this._animationData || {},
				callback = this._animationCallback;
				curve = curves[anim.curve] || "ease",
				fn = lang.hitch(this, function() {
					var transformCss = "";

					// Set the color and opacity properties
					anim.backgroundColor !== undef && (obj.backgroundColor = anim.backgroundColor);
					anim.opacity !== undef && setStyle(this.domNode, "opacity", anim.opacity);
					setStyle(this.domNode, "display", anim.visible !== undef && !anim.visible ? "none" : "");
					
					// TODO set border width here

					// Set the position and size properties
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
			anim.transform && setStyle("transform", "");
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
		
		constants: {
			size: undef,
			rect: undef
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
					dom.attr[value ? "add" : "remove"](this._focus.node, "tabindex", 0);
					return value;
				}
			},

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

			width: postLayoutProp,

			zIndex: postLayoutProp
		}

	});

});