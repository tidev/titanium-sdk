define(["Ti/_/declare", "Ti/_/UI/KineticScrollView", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, KineticScrollView, style, lang, UI) {

	return declare("Ti.UI.ScrollView", KineticScrollView, {

		constructor: function(args) {
	
			// Content must go in a separate container so the scrollbar can exist outside of it
			var self = this,
				contentContainer;
			this._initKineticScrollView(contentContainer = this._contentContainer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				left: 0,
				top: 0
			}), "both");
			this.domNode.style.overflow = "visible";

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
				self._setTranslation(-currentPositionX + e.wheelDeltaX,
					-currentPositionY + e.wheelDeltaY);

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
				setTimeout(function(){
					self._endScrollBars();
				},200);
			});
		},

		_handleDragStart: function() {
			var contentContainer = this._contentContainer,
				contentWidth = contentContainer._measuredWidth,
				contentHeight = contentContainer._measuredHeight,
				width = this._measuredWidth,
				height = this._measuredHeight;
			this._startScrollBars({
				x: -self._currentTranslationX / (contentWidth - width),
				y: -self._currentTranslationY / (contentHeight - height)
			},
			{
				x: width / (contentWidth),
				y: height / (contentHeight)
			});
			this._isScrollBarActive && this.fireEvent("dragStart",{});
		},

		_handleDrag: function() {
			var scrollLeft = -this._currentTranslationX,
				scrollTop = -this._currentTranslationY,
				contentContainer = this._contentContainer;
			this._isScrollBarActive && this.fireEvent("scroll",{
				x: scrollLeft,
				y: scrollTop,
				dragging: true
			});
			this._updateScrollBars({
				x: scrollLeft / (contentContainer._measuredWidth - this._measuredWidth),
				y: scrollTop / (contentContainer._measuredHeight - this._measuredHeight)
			});
		},

		_handleDragEnd: function(e, velocityX, velocityY) {
			this._endScrollBars();
			this._isScrollBarActive && this.fireEvent("dragEnd",{
				decelerate: false
			});
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