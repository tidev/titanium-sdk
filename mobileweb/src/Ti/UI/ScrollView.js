define("Ti/UI/ScrollView", ["Ti/_/declare", "Ti/UI/View", "Ti/_/style", "Ti/_/lang"], function(declare, View, style, lang) {

	return declare("Ti.UI.ScrollView", View, {
		
		constructor: function(args) {
			
			// Content must go in a separate container so the scrollbar can exist outside of it
			var contentContainer = this._contentContainer = Ti.UI.createView({
				width: "100%",
				height: "100%",
				left: 0,
				top: 0
			});
			View.prototype.add.call(this,contentContainer);
			style.set(contentContainer.domNode,"overflow","hidden");
			
			contentContainer.add(this._contentMeasurer = Ti.UI.createView({
				width: "auto",
				height: "auto",
				left: 0,
				top: 0
			}));
			
			this._createHorizontalScrollBar();
			this._createVerticalScrollBar();
			
			// Handle scrolling
			var previousTouchLocation;
			this.addEventListener("touchstart",function(e) {
				previousTouchLocation = {x: e.x, y: e.y};
				
				this._startScrollBars({
					x: contentContainer.domNode.scrollLeft / (this._contentMeasurer._measuredWidth - this._measuredWidth),
					y: contentContainer.domNode.scrollTop / (this._contentMeasurer._measuredHeight - this._measuredHeight),
				},
				{
					x: contentContainer._measuredWidth / (this._contentMeasurer._measuredWidth),
					y: contentContainer._measuredHeight / (this._contentMeasurer._measuredHeight),
				});
			});
			this.addEventListener("touchend",function(e) {
				previousTouchLocation = null;
				
				this._endScrollBars();
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				contentContainer.domNode.scrollLeft += previousTouchLocation.x - e.x;
				contentContainer.domNode.scrollTop += previousTouchLocation.y - e.y;
				previousTouchLocation = {x: e.x, y: e.y};
				
				this._updateScrollBars({
					x: contentContainer.domNode.scrollLeft / (this._contentMeasurer._measuredWidth - this._measuredWidth),
					y: contentContainer.domNode.scrollTop / (this._contentMeasurer._measuredHeight - this._measuredHeight),
				});
			}));
			var self = this;
			this.domNode.addEventListener("mousewheel",function(e) {
				self._startScrollBars({
					x: contentContainer.domNode.scrollLeft / (self._contentMeasurer._measuredWidth - self._measuredWidth),
					y: contentContainer.domNode.scrollTop / (self._contentMeasurer._measuredHeight - self._measuredHeight),
				},
				{
					x: contentContainer._measuredWidth / (self._contentMeasurer._measuredWidth),
					y: contentContainer._measuredHeight / (self._contentMeasurer._measuredHeight),
				});
				setTimeout(function(){
					contentContainer.domNode.scrollLeft -= e.wheelDeltaX;
					contentContainer.domNode.scrollTop -= e.wheelDeltaY;
					self._updateScrollBars({
						x: (contentContainer.domNode.scrollLeft - e.wheelDeltaX) / (self._contentMeasurer._measuredWidth - self._measuredWidth),
						y: (contentContainer.domNode.scrollTop - e.wheelDeltaY) / (self._contentMeasurer._measuredHeight - self._measuredHeight),
					});
					setTimeout(function(){
						self._endScrollBars();
					},10);
				},10);
			});
		},
		
		scrollTo: function(x,y) {
			x !== null && (this._contentContainer.scrollLeft = parseInt(x));
			y !== null && (this._contentContainer.scrollTop = parseInt(y));
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",
		_getContentOffset: function(){
			return this.contentOffset;
		},
		
		_doLayout: function() {
			this._contentMeasurer.layout = this.layout;
			View.prototype._doLayout.apply(this,arguments);
		},
		
		add: function(view) {
			this._contentMeasurer.add(view);
		},
		
		remove: function(view) {
			this._contentMeasurer.remove(view);
		},

		properties: {
			canCancelEvents: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.canCancelEvents" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.canCancelEvents" is not implemented yet.');
					return value;
				}
			},
			
			contentHeight: {
				get: function(value) {
					return this._contentMeasurer.height;
				},
				set: function(value) {
					this._contentMeasurer.height = value;
					return value;
				}
			},
			
			contentOffset: {
				get: function(value) {
					return {x: this._contentContainer.scrollLeft, y: this._contentContainer.scrollTop}
				},
				set: function(value) {
					return {x: this._contentContainer.scrollLeft, y: this._contentContainer.scrollTop};
				}
			},
			
			contentWidth: {
				get: function(value) {
					return this._contentMeasurer.width;
				},
				set: function(value) {
					this._contentMeasurer.width = value;
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