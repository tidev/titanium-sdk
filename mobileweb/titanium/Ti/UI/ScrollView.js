define(["Ti/_/declare", "Ti/_/UI/KineticScrollView", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, KineticScrollView, style, lang, UI) {

	var isDef = lang.isDef,

		// The amount of deceleration (in pixels/ms^2)
		deceleration = 0.00175;

	return declare("Ti.UI.ScrollView", KineticScrollView, {

		constructor: function(args) {
	
			// Content must go in a separate container so the scrollbar can exist outside of it
			var self = this,
				contentContainer,
				scrollbarTimeout;
			this._initKineticScrollView(contentContainer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				left: 0,
				top: 0
			}), "both");

			this._createHorizontalScrollBar();
			this._createVerticalScrollBar();

			// Handle mouse wheel scrolling
			this.domNode.addEventListener("mousewheel",function(e) {

				var distanceX = contentContainer._measuredWidth - self._measuredWidth,
					distanceY = contentContainer._measuredHeight - self._measuredHeight,
					currentPositionX = -self._currentTranslationX,
					currentPositionY = -self._currentTranslationY;

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
				self._isScrollBarActive && self.fireEvent("scroll",{
					x: currentPositionX,
					y: currentPositionY,
					dragging: false
				});
				self._updateScrollBars({
					x: currentPositionX / distanceX,
					y: currentPositionY / distanceY
				});
				clearTimeout(scrollbarTimeout);
				scrollbarTimeout = setTimeout(function(){
					self._endScrollBars();
				},1000);
			});
		},

		_handleDragStart: function() {
			var contentContainer = this._contentContainer,
				x = -this._currentTranslationX,
				y = -this._currentTranslationY,
				width = this._measuredWidth,
				height = this._measuredHeight,
				contentWidth = contentContainer._measuredWidth,
				contentHeight = contentContainer._measuredHeight;
			this._startScrollBars({
				x: x / (contentWidth - width),
				y: y / (contentHeight - height)
			},
			{
				x: width / contentWidth,
				y: height / contentHeight
			});
			this.fireEvent("dragStart",{});
		},

		_handleDrag: function() {
			var x = -this._currentTranslationX,
				y = -this._currentTranslationY,
				contentContainer = this._contentContainer;
			this._updateScrollBars({
				x: x / (contentContainer._measuredWidth - this._measuredWidth),
				y: y / (contentContainer._measuredHeight - this._measuredHeight)
			});
			this.fireEvent("scroll",{
				x: x,
				y: y,
				dragging: true
			});
		},

		_handleDragEnd: function(e, velocityX, velocityY) {
			this._endScrollBars();
			if (isDef(velocityX)) {
				var self = this,
					velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY),
					distance = velocity * velocity / (1.724 * deceleration),
					duration = velocity / deceleration,
					theta = Math.atan(Math.abs(velocityY / velocityX)),
					distanceX = distance * Math.cos(theta) * (velocityX < 0 ? -1 : 1),
					distanceY = distance * Math.sin(theta) * (velocityY < 0 ? -1 : 1),
					translationX = Math.min(0, Math.max(self._minTranslationX, self._currentTranslationX + distanceX)),
					translationY = Math.min(0, Math.max(self._currentTranslationY + distanceY));
				self._isScrollBarActive && self.fireEvent("dragEnd",{
					decelerate: true
				});
				self._animateToPosition(translationX, translationY, duration, "ease-out", function() {
					self._setTranslation(translationX, translationY);
				});
			}
		},

		_handleDragCancel: function() {
			this._endScrollBars();
		},

		scrollTo: function(x, y) {
			var n = this._contentContainer.domNode;
			x !== null && (n.scrollLeft = parseInt(x));
			y !== null && (n.scrollTop = parseInt(y));
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_getContentOffset: function(){
			return this.contentOffset;
		},

		_preLayout: function() {
			var needsRecalculation = this._contentContainer.layout === this.layout
			this._contentContainer.layout = this.layout;
			return needsRecalculation;
		},

		add: function(view) {
			this._contentContainer._add(view);
			this._publish(view);
		},

		remove: function(view) {
			this._contentContainer.remove(view);
			this._unpublish(view);
		},

		properties: {
			contentHeight: {
				get: function(value) {
					return this._contentContainer.height;
				},
				set: function(value) {
					this._contentContainer.height = value;
					return value;
				}
			},

			contentOffset: {
				get: function(value) {
					return {x: this._contentContainer.domNode.scrollLeft, y: this._contentContainer.domNode.scrollTop}
				},
				set: function(value) {
					this._contentContainer.domNode.scrollLeft = value.x;
					this._contentContainer.domNode.scrollTop = value.y;
					return value;
				}
			},

			contentWidth: {
				get: function(value) {
					return this._contentContainer.width;
				},
				set: function(value) {
					this._contentContainer.width = value;
					return value;
				}
			},

			showHorizontalScrollIndicator: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							this._createHorizontalScrollBar();
						} else {
							this._destroyHorizontalScrollBar();
						}
					}
					return value;
				},
				value: true
			},

			showVerticalScrollIndicator: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							this._createVerticalScrollBar();
						} else {
							this._destroyVerticalScrollBar();
						}
					}
					return value;
				},
				value: true
			}
		}

	});

});