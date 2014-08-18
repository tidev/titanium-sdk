define(["Ti/_/browser", "Ti/_/declare", "Ti/UI/View", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, View, lang, dom, style, UI, event) {

	var setStyle = style.set,
		unitize = dom.unitize,
		calculateDistance = dom.calculateDistance,
		on = require.on,

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
			self._kineticTransform = UI.create2DMatrix();
			
			(scrollbars === "horizontal" || scrollbars === "both") && self._createHorizontalScrollBar();
			(scrollbars === "vertical" || scrollbars === "both") && self._createVerticalScrollBar();

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
			
			function setMinTranslations() {
				minTranslationX = self._minTranslationX = Math.min(0, self._measuredWidth - self._borderLeftWidth - self._borderRightWidth - self._contentContainer._measuredWidth);
				minTranslationY = self._minTranslationY = Math.min(0, self._measuredHeight - self._borderTopWidth - self._borderBottomWidth - self._contentContainer._measuredHeight);
			}
			
			on(self._contentContainer, "postlayout", function() {
				setMinTranslations();
				self._setTranslation(self._currentTranslationX, self._currentTranslationY);
			});

			on(self, "draggingstart", function(e) {
				if (self.scrollingEnabled) {
					self._cancelAnimations();

					// Initialize the velocity calculations
					velocityX = void 0;
					velocityY = void 0;
					startTranslationX = self._currentTranslationX;
					startTranslationY = self._currentTranslationY;
					numSamples = 0;
					previousTime = (new Date).getTime();

					setMinTranslations();

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
					
					self._handleDrag && self._handleDrag(e);
				}
			});

			on(self, "draggingcancel", function(e) {
				if (self.scrollingEnabled) {
					self._animateToPosition(startTranslationX, startTranslationY, 400 + 0.3 * calculateDistance(
							startTranslationX, startTranslationY, self._currentTranslationX, self._currentTranslationY),
						UI.ANIMATION_CURVE_EASE_IN_OUT, function(){
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
						self._animateToPosition(x, y, 200, UI.ANIMATION_CURVE_EASE_OUT, function(){
							self._handleDragEnd && self._handleDragEnd(e);
							self._endScrollBars();
						});
					} else {
						self._handleDragEnd && self._handleDragEnd(e, velocityX, velocityY);
					}
				}
			});

			var mouseWheelEvent = navigator.userAgent.indexOf("Firefox") != -1 ? "DOMMouseScroll" : "mousewheel";
			enableMouseWheel && (this._disconnectMouseWheelEvent = on(self.domNode, mouseWheelEvent,function(e) {
				if (self.scrollingEnabled) {

					if (mouseWheelEvent == "DOMMouseScroll") { //Patch Firefox
						e.wheelDeltaY = - e.detail * 40; //Normalize Value (FF "detail" is either 3 or -3)
						e.wheelDeltaX = 0;
					} else if (e.wheelDelta && !e.wheelDeltaX) { //Patch IE as it only has e.wheelDelta
						e.wheelDeltaY = e.wheelDelta;
						e.wheelDeltaX = 0;
					}
					if (e.shiftKey) { //Translate the scroll direction by 90 degrees for shift + scroll
						e.wheelDeltaX = e.wheelDeltaY;
						e.wheelDeltaY = 0;
					} else if (e.ctrlKey) {
						//TODO turn control + mousewheel into zoom/pinch
						e.preventDefault(); //For now, prevent standard browser ctrl + scroll zoom
						return false;
					}

					self._cancelAnimations();
					var distanceX = contentContainer._measuredWidth - self._measuredWidth,
						distanceY = contentContainer._measuredHeight - self._measuredHeight,
						currentPositionX = -self._currentTranslationX,
						currentPositionY = -self._currentTranslationY;

					setMinTranslations();

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
				contentContainerDomNode = contentContainer.domNode,
				destination,
				horizontalScrollBar = self._horizontalScrollBar,
				verticalScrollBar = self._verticalScrollBar;
			
			if (calculateDistance(self._currentTranslationX, self._currentTranslationY, destinationTranslationX, destinationTranslationY) < 1) {
				self._setTranslation(destinationTranslationX, destinationTranslationY);
				callback();
			} else {

				// Animate the contents
				destination = self._setTranslation(destinationTranslationX, destinationTranslationY, 1);
				self._contentAnimation = contentContainer.animate({
					transform: self._kineticTransform.translate(destination.translationX, destination.translationY),
					duration: Math.round(duration),
					curve: curve
				}, callback);

				// Animate the scroll bars
				self._horizontalScrollBarAnimation = horizontalScrollBar && horizontalScrollBar.animate({
					transform: this._kineticTransform.translate(Math.max(0,Math.min(1, 
						-destination.translationX / (contentContainer._measuredWidth - self._measuredWidth))) *
						(this._measuredWidth - this._scrollBarWidth), 0),
					duration: duration,
					curve: curve
				});
				self._verticalScrollBarAnimation = verticalScrollBar && verticalScrollBar.animate({
					transform: this._kineticTransform.translate(0, Math.max(0,Math.min(1, 
						-destination.translationY / (contentContainer._measuredHeight - self._measuredHeight))) *
						(this._measuredHeight - this._scrollBarHeight)),
					duration: duration,
					curve: curve
				});
			}
		},

		_setTranslation: function(translationX, translationY, dontSet) {

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
					this._measuredHeight < contentContainer._measuredHeight,
				width = this._measuredWidth,
				height = this._measuredHeight,
				contentWidth = contentContainer._measuredWidth,
				contentHeight = contentContainer._measuredHeight;

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
			dontSet || this._contentContainer.animate({
				transform: this._kineticTransform.translate(this._currentTranslationX = translationX, this._currentTranslationY = translationY)
			});

			// Update the scroll bars
			if (this._isScrollBarActive) {
				var horizontalScrollBar = this._horizontalScrollBar,
					verticalScrollBar = this._verticalScrollBar;
				
				horizontalScrollBar && horizontalScrollBar.animate({
					transform: this._kineticTransform.translate(Math.max(0,Math.min(1, 
						-translationX / (contentWidth - width))) * (this._measuredWidth - this._scrollBarWidth), 0)
				});
				
				verticalScrollBar && verticalScrollBar.animate({
					transform: this._kineticTransform.translate(0, Math.max(0,Math.min(1,
						-translationY / (contentHeight - height))) * (this._measuredHeight - this._scrollBarHeight))
				});
			}

			// Return the results
			return {
				translationX: translationX,
				translationY: translationY
			}
		},

		_cancelAnimations: function() {
			this._horizontalScrollBarAnimation && this._horizontalScrollBarAnimation.cancel();
			this._verticalScrollBarAnimation && this._verticalScrollBarAnimation.cancel();
			this._contentAnimation && this._contentAnimation.cancel();
		},

		_createHorizontalScrollBar: function() {
			this._horizontalScrollBar || this._add(this._horizontalScrollBar = UI.createView({
				zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
				backgroundColor: "#555",
				borderRadius: 3,
				width: 0,
				height: 6,
				left: 0,
				bottom: 0,
				opacity: 0
			}));
		},
		
		_createVerticalScrollBar: function() {			
			this._verticalScrollBar || this._add(this._verticalScrollBar = UI.createView({
				zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
				backgroundColor: "#555",
				borderRadius: 3,
				width: 6,
				height: 0,
				right: 0,
				top: 0,
				opacity: 0
			}));
		},

		_destroyHorizontalScrollBar: function() {
			this._horizontalScrollBarAnimation && this._horizontalScrollBarAnimation.cancel();
			this._remove(this._horizontalScrollBar);
		},

		_destroyVerticalScrollBar: function() {
			this._verticalScrollBarAnimation && this._verticalScrollBarAnimation.cancel();
			this._remove(this._verticalScrollBar);
		},

		_startScrollBars: function(normalizedScrollPosition, visibleAreaRatio) {

			if (this._horizontalScrollBar && visibleAreaRatio.x < 1 && visibleAreaRatio.x > 0) {
				var measuredWidth = this._measuredWidth,
					scrollBarWidth = this._scrollBarWidth = Math.round(Math.max(10, measuredWidth * visibleAreaRatio.x)),
					horizontalScrollBar = this._horizontalScrollBar;
				horizontalScrollBar.opacity = 0.5;
				horizontalScrollBar.domNode.style.width = unitize(scrollBarWidth);
				horizontalScrollBar.animate({
					transform: this._kineticTransform.translate(Math.max(0, Math.min(1, normalizedScrollPosition.x)) * 
						(measuredWidth - scrollBarWidth), 0)
				});
				this._isScrollBarActive = 1;
			}

			if (this._verticalScrollBar && visibleAreaRatio.y < 1 && visibleAreaRatio.y > 0) {
				var measuredHeight = this._measuredHeight,
					scrollBarHeight = this._scrollBarHeight = Math.round(Math.max(10, measuredHeight * visibleAreaRatio.y)),
					verticalScrollBar = this._verticalScrollBar;
				verticalScrollBar.opacity = 0.5;
				verticalScrollBar.domNode.style.height = unitize(scrollBarHeight);
				verticalScrollBar.animate({
					transform: this._kineticTransform.translate(0, Math.max(0, Math.min(1, normalizedScrollPosition.y)) * 
						(measuredHeight - scrollBarHeight))
				});
				this._isScrollBarActive = 1;
			}
		},

		_endScrollBars: function() {
			if (this._isScrollBarActive) {
				var self = this,
					horizontalScrollBar = self._horizontalScrollBar,
					verticalScrollBar = self._verticalScrollBar;

				function animateScrollBar(scrollBar) {
					scrollBar && scrollBar.animate({
						opacity: 0,
						duration: 500
					}, function() {
						self._isScrollBarActive = false;
					});
				}

				animateScrollBar(horizontalScrollBar);
				animateScrollBar(verticalScrollBar);
			}
		},
		
		properties: {
			scrollingEnabled: true
		}
	});
});