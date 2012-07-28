define(["Ti/_/browser", "Ti/_/declare", "Ti/UI/View", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, View, lang, dom, style, UI, event) {

	var setStyle = style.set,
		unitize = dom.unitize,
		calculateDistance = dom.calculateDistance,
		on = require.on,
		transitionEvents = {
			webkit: "webkitTransitionEnd",
			trident: "msTransitionEnd",
			gecko: "transitionend",
			presto: "oTransitionEnd"
		},
		transitionEnd = transitionEvents[browser.runtime] || "transitionEnd",

		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		distanceThreshold = 50,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		velocityThreshold = 0.5,

		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		minimumFlickDistanceScaleFactor = 15,

		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		minimumDragDistanceScaleFactor = 2,

		// The default velocity when there isn't enough data to calculate the velocity
		defaultVelocity = 0.5,

		// This is the limit that elastic drags will go towards (i.e. limit as x->infinity = elasticityLimit)
		elasticityLimit = 100,

		// Controls the friction curve for elastic dragging. The higher the value, the sooner drag starts to kick in. 
		// Must be greater than or equal to elasticityLimit otherwise the curve has a slope greater than 1, which is bad.
		elasticityDrag = 100;

	return declare("Ti._.UI.KineticScrollView", View, {

		_initKineticScrollView: function(contentContainer, elasticity, scrollbars, enableMouseWheel){

			var contentContainerDomNode,
				self = this,
				velocity = 0,
				startTranslationX,
				startTranslationY,
				translationX,
				translationY,
				minTranslationX,
				minTranslationY,
				positionData,
				previousTime,
				currentTime,
				period,
				previousTranslationX,
				previousTranslationY,
				numSamples,
				velocityX,
				velocityY,
				scrollbarTimeout;
			self._currentTranslationX = 0;
			self._currentTranslationY = 0;
			self._horizontalElastic = elasticity === "horizontal" || elasticity === "both";
			self._verticalElastic = elasticity === "vertical" || elasticity === "both";
			
			(scrollbars === "horizontal" || scrollbars === "both") && this._createHorizontalScrollBar();
			(scrollbars === "vertical" || scrollbars === "both") && this._createVerticalScrollBar();

			// Create the content container
			self._add(self._contentContainer = contentContainer);
			contentContainerDomNode = contentContainer.domNode;

			// Calculate the velocity by calculating a weighted slope average, favoring more recent movement
			function calculateVelocity() {
				currentTime = Date.now();
				period = currentTime - previousTime;
				previousTime = currentTime;
				if (numSamples++) {
					velocityX = (velocityX * (numSamples - 1) + numSamples * (translationX - previousTranslationX) / period) / 2 / numSamples;
					velocityY = (velocityY * (numSamples - 1) + numSamples * (translationY - previousTranslationY) / period) / 2 / numSamples;
				} else {
					velocityX = (translationX - startTranslationX) / period;
					velocityY = (translationY - startTranslationY) / period;
				}
			}

			on(self, "draggingstart", function(e) {
				if (this.scrollingEnabled) {

					// Initialize the velocity calculations
					velocityX = void 0;
					velocityY = void 0;
					startTranslationX = self._currentTranslationX;
					startTranslationY = self._currentTranslationY;
					numSamples = 0;
					previousTime = (new Date).getTime();

					minTranslationX = self._minTranslationX = Math.min(0, self._measuredWidth - self._borderLeftWidth - self._borderRightWidth - self._contentContainer._measuredWidth);
					minTranslationY = self._minTranslationY = Math.min(0, self._measuredHeight - self._borderTopWidth - self._borderBottomWidth - self._contentContainer._measuredHeight);

					// Start the scroll bars
					var width = self._measuredWidth,
						height = self._measuredHeight,
						contentWidth = contentContainer._measuredWidth,
						contentHeight = contentContainer._measuredHeight;
					self._startScrollBars({
						x: -self._currentTranslationX / (contentWidth - width),
						y: -self._currentTranslationY / (contentHeight - height)
					},
					{
						x: width / contentWidth,
						y: height / contentHeight
					});

					// Call the callback
					self._handleDragStart && self._handleDragStart(e);
				}
			});

			on(self, "dragging", function(e) {
				if (self.scrollingEnabled) {
					// Update the velocity calculations
					translationX = startTranslationX + e.distanceX;
					translationY = startTranslationY + e.distanceY;
					calculateVelocity();

					// Update the translation
					self._setTranslation(previousTranslationX = translationX, previousTranslationY = translationY);

					// Update the scroll bars
					var width = self._measuredWidth,
						height = self._measuredHeight,
						contentWidth = contentContainer._measuredWidth,
						contentHeight = contentContainer._measuredHeight;
					self._updateScrollBars({
						x: -self._currentTranslationX / (contentWidth - width),
						y: -self._currentTranslationY / (contentHeight - height)
					});
					
					self._handleDrag && self._handleDrag(e);
				}
			});

			on(self, "draggingcancel", function(e) {
				if (self.scrollingEnabled) {
					self._animateToPosition(startTranslationX, startTranslationY, 400 + 0.3 * calculateDistance(
							startTranslationX, startTranslationY, self._currentTranslationX, self._currentTranslationY),
						"ease-in-out", function(){
							self._handleDragCancel && self._handleDragCancel(e);
						});
					self._endScrollBars();
					self._handleDragCancel && self._handleDragCancel(e);
				}
			});

			on(self, "draggingend", function(e) {
				if (self.scrollingEnabled) {
					translationX = startTranslationX + e.distanceX;
					translationY = startTranslationY + e.distanceY;
					calculateVelocity();
					var x = self._currentTranslationX,
						y = self._currentTranslationY,
						springBack;

					// Spring back if need be
					if (x > 0) {
						x = 0;
						springBack = 1;
					} else if(x < minTranslationX) {
						x = minTranslationX;
						springBack = 1;
					}
					if (y > 0) {
						y = 0;
						springBack = 1;
					} else if(y < minTranslationY) {
						y = minTranslationY;
						springBack = 1;
					}

					if (springBack) {
						self._animateToPosition(x, y, 200, "ease-out", function(){
							self._handleDragEnd && self._handleDragEnd(e);
						});
					} else {
						self._handleDragEnd && self._handleDragEnd(e, velocityX, velocityY);
					}
				}
			});

			// Handle mouse wheel scrolling
			enableMouseWheel && (this._disconnectMouseWheelEvent = on(self.domNode, "mousewheel",function(e) {
				if (self.scrollingEnabled) {
					var distanceX = contentContainer._measuredWidth - self._measuredWidth,
						distanceY = contentContainer._measuredHeight - self._measuredHeight,
						currentPositionX = -self._currentTranslationX,
						currentPositionY = -self._currentTranslationY;

					minTranslationX = self._minTranslationX = Math.min(0, self._measuredWidth - self._borderLeftWidth - self._borderRightWidth - self._contentContainer._measuredWidth);
					minTranslationY = self._minTranslationY = Math.min(0, self._measuredHeight - self._borderTopWidth - self._borderBottomWidth - self._contentContainer._measuredHeight);

					// Start the scrollbar
					self._startScrollBars({
						x: currentPositionX / distanceX,
						y: currentPositionY / distanceY
					},
					{
						x: self._measuredWidth / contentContainer._measuredWidth,
						y: self._measuredHeight / contentContainer._measuredHeight
					});

					// Set the scroll position
					self._setTranslation(Math.min(0, Math.max(self._minTranslationX,-currentPositionX + e.wheelDeltaX)),
						Math.min(0, Math.max(self._minTranslationY,-currentPositionY + e.wheelDeltaY)));

					// Create the scroll event and immediately update the position
					self._updateScrollBars({
						x: currentPositionX / distanceX,
						y: currentPositionY / distanceY
					});
					clearTimeout(scrollbarTimeout);
					scrollbarTimeout = setTimeout(function(){
						self._endScrollBars();
					},500);

					self._handleMouseWheel && self._handleMouseWheel();
				}
			}));
		},

		destroy: function() {
			this._disconnectMouseWheelEvent && this._disconnectMouseWheelEvent();
			View.prototype.destroy.apply(this, arguments);
		},

		_animateToPosition: function(destinationTranslationX, destinationTranslationY, duration, curve, callback) {
			var self = this,
				contentContainer = self._contentContainer,
				contentContainerDomNode = contentContainer.domNode;
			if (calculateDistance(self._currentTranslationX, self._currentTranslationY, destinationTranslationX, destinationTranslationY) < 1) {
				self._setTranslation(destinationTranslationX, destinationTranslationY);
				callback();
			} else {
				setStyle(contentContainerDomNode, "transition", "all " + duration + "ms " + curve);
				setTimeout(function(){
					self._setTranslation(destinationTranslationX, destinationTranslationY);
					self._animateScrollBars({
						x: -self._currentTranslationX / (contentContainer._measuredWidth - self._measuredWidth),
						y: -self._currentTranslationY / (contentContainer._measuredHeight - self._measuredHeight)
					}, duration, curve);
				},1);
				on.once(contentContainerDomNode, transitionEnd, function(){
					setStyle(contentContainerDomNode, "transition", "");
					callback && callback();
				});
			}
		},

		_setTranslation: function(translationX, translationY) {

			// Check if the translation is outside the limits of the view and apply elasticity
			function elastize(value) {
				return elasticityLimit * (-1 / (value / elasticityDrag + 1) + 1);
			}
			var contentContainer = this._contentContainer,
				minTranslationX = this._minTranslationX,
				minTranslationY = this._minTranslationY,
				horizontalElastic = this._horizontalElastic && !this.disableBounce && 
					this._measuredWidth < contentContainer._measuredWidth,
				verticalElastic = this._verticalElastic && !this.disableBounce && 
					this._measuredHeight < contentContainer._measuredHeight;
			if (translationX > 0) {
				translationX = horizontalElastic ? elastize(translationX) : 0;
			} else if(translationX < minTranslationX) {
				translationX = horizontalElastic ? minTranslationX - elastize(minTranslationX - translationX) : minTranslationX;
			}
			if (translationY > 0) {
				translationY = verticalElastic ? elastize(translationY) : 0;
			} else if(translationY < minTranslationY) {
				translationY = verticalElastic ? minTranslationY - elastize(minTranslationY - translationY) : minTranslationY;
			}

			// Apply the translation
			setStyle(this._contentContainer.domNode, "transform", "translate(" + 
				(this._currentTranslationX = translationX) + "px, " + (this._currentTranslationY = translationY) + "px)");
		},

		_createHorizontalScrollBar: function() {
			this._horizontalScrollBar = dom.create("div", {
				className: "TiUIScrollBar",
				style: {
					position: 'absolute',
					zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
					border: "3px solid #555",
					borderRadius: "3px",
					height: "0px",
					bottom: "0px",
					opacity: 0
				}
			}, this.domNode);
		},

		_destroyHorizontalScrollBar: function() {
			this._cancelPreviousAnimation();
			dom.destroy(this._horizontalScrollBar);
		},

		_createVerticalScrollBar: function() {
			var scrollBar = this._verticalScrollBar = dom.create("div", {
				className: "TiUIScrollBar",
				style: {
					position: 'absolute',
					zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
					border: "3px solid #555",
					borderRadius: "3px",
					width: "0px",
					right: "0px",
					opacity: 0
				}
			}, this.domNode);
		},

		_destroyVerticalScrollBar: function() {
			this._cancelPreviousAnimation();
			dom.destroy(this._verticalScrollBar);
		},

		_cancelPreviousAnimation: function() {
			if (this._isScrollBarActive) {
				setStyle(this._horizontalScrollBar,"transition","");
				setStyle(this._verticalScrollBar,"transition","");
				clearTimeout(this._horizontalScrollBarTimer);
				clearTimeout(this._verticalScrollBarTimer);
			}
		},

		_startScrollBars: function(normalizedScrollPosition, visibleAreaRatio) {

			this._cancelPreviousAnimation();

			if (this._horizontalScrollBar && visibleAreaRatio.x < 1 && visibleAreaRatio.x > 0) {
				var startingX = normalizedScrollPosition.x,
					measuredWidth = this._measuredWidth;
				startingX < 0 && (startingX = 0);
				startingX > 1 && (startingX = 1);
				this._horizontalScrollBarWidth = (measuredWidth - 6) * visibleAreaRatio.x;
				this._horizontalScrollBarWidth < 10 && (this._horizontalScrollBarWidth = 10);
				setStyle(this._horizontalScrollBar, {
					opacity: 0.5,
					left: unitize(startingX * (measuredWidth - this._horizontalScrollBarWidth - 6)),
					width: unitize(this._horizontalScrollBarWidth)
				});
				this._isScrollBarActive = true;
			}

			if (this._verticalScrollBar && visibleAreaRatio.y < 1 && visibleAreaRatio.y > 0) {
				var startingY = normalizedScrollPosition.y,
					measuredHeight = this._measuredHeight;
				startingY < 0 && (startingY = 0);
				startingY > 1 && (startingY = 1);
				this._verticalScrollBarHeight = (measuredHeight - 6) * visibleAreaRatio.y;
				this._verticalScrollBarHeight < 10 && (this._verticalScrollBarHeight = 10);
				setStyle(this._verticalScrollBar, {
					opacity: 0.5,
					top: unitize(startingY * (measuredHeight - this._verticalScrollBarHeight - 6)),
					height: unitize(this._verticalScrollBarHeight)
				});
				this._isScrollBarActive = true;
			}
		},

		_updateScrollBars: function(normalizedScrollPosition) {
			if (this._isScrollBarActive) {
				this._horizontalScrollBar && setStyle(this._horizontalScrollBar,"left",unitize(Math.max(0,Math.min(1,normalizedScrollPosition.x)) *
					(this._measuredWidth - this._horizontalScrollBarWidth - 6)));
				this._verticalScrollBar && setStyle(this._verticalScrollBar,"top",unitize(Math.max(0,Math.min(1,normalizedScrollPosition.y)) *
					(this._measuredHeight - this._verticalScrollBarHeight - 6)));
			}
		},

		_animateScrollBars: function(normalizedScrollPosition, duration, curve) {
			var self = this,
				horizontalScrollBar = self._horizontalScrollBar,
				verticalScrollBar = self._verticalScrollBar;
			if (self._isScrollBarActive) {
				if (horizontalScrollBar) {
					setStyle(horizontalScrollBar, "transition", "all " + duration + "ms " + curve);
					on.once(horizontalScrollBar, transitionEnd, function(){
						setStyle(horizontalScrollBar, "transition", "");
					});
				}
				if (verticalScrollBar) {
					setStyle(verticalScrollBar, "transition", "all " + duration + "ms " + curve);
					on.once(verticalScrollBar, transitionEnd, function(){
						setStyle(verticalScrollBar, "transition", "");
					});
				}
				setTimeout(function() {
					self._updateScrollBars(normalizedScrollPosition);
				}, 1);
			}
		},

		_endScrollBars: function() {
			var self = this;
			setTimeout(function(){
				if (self._isScrollBarActive) {
					if (self._horizontalScrollBar) {
						var horizontalScrollBar = self._horizontalScrollBar;
						if (horizontalScrollBar) {
							setStyle(horizontalScrollBar,"transition","all 1s ease-in-out");
							setTimeout(function(){
								setStyle(horizontalScrollBar,"opacity",0);
								self._horizontalScrollBarTimer = setTimeout(function(){
									self._isScrollBarActive = false;
									setStyle(horizontalScrollBar,"transition","");
								},500);
							},0);
						}
					}
		
					if (self._verticalScrollBar) {
						var verticalScrollBar = self._verticalScrollBar;
						if (verticalScrollBar) {
							setStyle(verticalScrollBar,"transition","all 1s ease-in-out");
							setTimeout(function(){
								setStyle(verticalScrollBar,"opacity",0);
								self._verticalScrollBarTimer = setTimeout(function(){
									self._isScrollBarActive = false;
									setStyle(verticalScrollBar,"transition","");
								},500);
							},0);
						}
					}
				}
			}, 10);
		},
		
		properties: {
			scrollingEnabled: true
		}
	});
});