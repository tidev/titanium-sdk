define("Ti/UI/View",
	["Ti/_/declare", "Ti/_/dom", "Ti/_/UI/Element", "Ti/_/lang", "Ti/_/string", "Ti/_/Layouts", "Ti/_/style"],
	function(declare, dom, Element, lang, string, Layouts, style) {
		
	var unitize = dom.unitize,
		set = style.set;

	return declare("Ti.UI.View", Element, {

		_parent: null,

		constructor: function() {
			this.children = [];
			this.layout = "absolute";
			this.containerNode = this.domNode;
		},

		add: function(view) {
			view._setParent(this);
			this.children.push(view);
			this.containerNode.appendChild(view.domNode);
			this._triggerLayout();
		},

		_setParent: function(view) {
			this._parent = view;
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

		remove: function(view) {
			var i = 0,
				l = this.children.length;
			for (; i < l; i++) {
				if (this.children[i] === view) {
					l = this.children.splice(i, 1);
					l[0]._setParent();
					break;
				}
			}
			dom.detach(view.domNode);
			this._triggerLayout();
		},
		
		_removeAllChildren: function(view) {
			var children = this.children;
			while(children.length > 0) {
				this.remove(children[0]);
			}
			this._triggerLayout();
		},
		
		_getScrollableContentWidth: function() {
			return 600;
		},
		
		_getScrollablePosition: function() {
			return {x: 0, y: 0};
		},
		
		_createHorizontalScrollBar: function() {
			var scrollBar = this._horizontalScrollBar = dom.create("div", {
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
			if (this._scrollingEnabled) {
				set(this._horizontalScrollBar,"transition","");
				set(this._verticalScrollBar,"transition","");
				clearTimeout(this._horizontalScrollBarTimer);
				clearTimeout(this._verticalScrollBarTimer);
			}
		},
		
		_startScrollBars: function(normalizedScrollPosition, visibleAreaRatio) {
			
			this._cancelPreviousAnimation();
			this._scrollingEnabled = true;
			
			if (this._horizontalScrollBar) {
				var startingX = normalizedScrollPosition.x,
					measuredWidth = this._measuredWidth;
				startingX < 0 && (startingX = 0);
				startingX > 1 && (startingX = 1);
				this._horizontalScrollBarWidth = (measuredWidth - 6) * visibleAreaRatio.x;
				this._horizontalScrollBarWidth < 10 && (this._horizontalScrollBarWidth = 10);
				set(this._horizontalScrollBar, {
					opacity: 0.5,
					left: unitize(startingX * (measuredWidth - this._horizontalScrollBarWidth - 6)),
					width: unitize(this._horizontalScrollBarWidth)
				});
			}
			
			if (this._verticalScrollBar) {
				var startingY = normalizedScrollPosition.y,
					measuredHeight = this._measuredHeight;
				startingY < 0 && (startingY = 0);
				startingY > 1 && (startingY = 1);
				this._verticalScrollBarHeight = (measuredHeight - 6) * visibleAreaRatio.y;
				this._verticalScrollBarHeight < 10 && (this._verticalScrollBarHeight = 10);
				set(this._verticalScrollBar, {
					opacity: 0.5,
					top: unitize(startingY * (measuredHeight - this._verticalScrollBarHeight - 6)),
					height: unitize(this._verticalScrollBarHeight)
				});
			}
		},
		
		_updateScrollBars: function(normalizedScrollPosition) {
			if (this._horizontalScrollBar) {
				var newX = normalizedScrollPosition.x,
					measuredWidth = this._measuredWidth;
				newX < 0 && (newX = 0);
				newX > 1 && (newX = 1);
				set(this._horizontalScrollBar,"left",unitize(newX * (measuredWidth - this._horizontalScrollBarWidth - 6)));
			}
			
			if (this._verticalScrollBar) {
				var newY = normalizedScrollPosition.y,
					measuredHeight = this._measuredHeight;
				newY < 0 && (newY = 0);
				newY > 1 && (newY = 1);
				set(this._verticalScrollBar,"top",unitize(newY * (measuredHeight - this._verticalScrollBarHeight - 6)));
			}
		},
		
		_endScrollBars: function() {
			var self = this;
			if (this._horizontalScrollBar) {
				var horizontalScrollBar = this._horizontalScrollBar;
				if (horizontalScrollBar) {
					set(horizontalScrollBar,"transition","all 1s ease-in-out");
					setTimeout(function(){
						set(horizontalScrollBar,"opacity",0);
						self._horizontalScrollBarTimer = setTimeout(function(){
							self._scrollingEnabled = false;
							set(horizontalScrollBar,"transition","");
						},500);
					},0);
				}
			}
			
			if (this._verticalScrollBar) {
				var verticalScrollBar = this._verticalScrollBar;
				if (verticalScrollBar) {
					set(verticalScrollBar,"transition","all 1s ease-in-out");
					setTimeout(function(){
						set(verticalScrollBar,"opacity",0);
						self._verticalScrollBarTimer = setTimeout(function(){
							self._scrollingEnabled = false;
							set(verticalScrollBar,"transition","");
						},500);
					},0);
				}
			}
		},

		destroy: function() {
			if (!this._destroyed) {
				var i = 0,
					l = this.children.length;
				for (; i < l; i++) {
					this.children[i].destroy();
					this.children[i] = null;
				}
				this.children = null;
				Element.prototype.destroy.apply(this, arguments);
			}
		},

		_defaultWidth: "100%",

		_defaultHeight: "100%",

		properties: {
			layout: {
				set: function(value) {
					var match = value.toLowerCase().match(/^(horizontal|vertical)$/),
						value = match ? match[0] : "absolute";

					if (this._layout) {
						this._layout.destroy();
						this._layout = null;
					}

					this._layout = new Layouts[string.capitalize(value)](this);

					return value;
				}
			}
		}

	});

});