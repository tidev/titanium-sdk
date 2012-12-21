/*global define*/
define(['Ti/_/declare', 'Ti/UI/View', 'Ti/_/style', 'Ti/_/lang', 'Ti/UI'],
	function(declare, View, style, lang, UI) {

	var isDef = lang.isDef,
		setStyle = style.set,
		on = require.on;

	return declare('Ti.UI.ScrollView', View, {

		constructor: function() {
			var startedAtTop,
				startedAtBottom,
				startY,
				innerNode,
				outerNode = this.domNode;
			setStyle(outerNode, {
				overflow: 'scroll',
				overflowScrolling: 'touch'
			});
			this._add(this._contentContainer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				_minWidth: '100%',
				_minHeight: '100%',
				left: 0,
				top: 0
			}));
			innerNode = this._contentContainer.domNode;
			this._innerMarginWidth = this._innerMarginHeight = UI._scrollbarWidth;
			on(outerNode, 'touchstart', function(e) {
				startedAtTop = outerNode.scrollTop === 0;
				startedAtBottom = outerNode.scrollTop === innerNode.clientHeight - outerNode.clientHeight;
				startY = e.touches[0].clientY;
			});
			on(outerNode, 'touchmove', function(e) {
				e._allowDefault = e.touches.length === 1 && (!startedAtTop || e.touches[0].clientY < startY - 1) &&
					(!startedAtBottom || e.touches[0].clientY > startY + 1);
			});
		},

		scrollTo: function(x, y) {
			var node = this.domNode;
			node.scrollTop = x;
			node.scrollLeft = y;
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_getContentOffset: function(){
			return this.contentOffset;
		},

		_preLayout: function() {
			var needsRecalculation = this._contentContainer.layout === this.layout;
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
				get: function() {
					return this._contentContainer.height;
				},
				set: function(value) {
					this._contentContainer.height = value;
					return value;
				}
			},

			contentOffset: {
				get: function() {
					return {
						x: -this._currentTranslationX,
						y: -this._currentTranslationY
					};
				},
				set: function(value) {
					this._setTranslation(isDef(value.x) ? -value.x : this._currentTranslationX,
						isDef(value.y) ? -value.y : this._currentTranslationY);
					return value;
				}
			},

			contentWidth: {
				get: function() {
					return this._contentContainer.width;
				},
				set: function(value) {
					this._contentContainer.width = value;
					return value;
				}
			},

			disableBounce: false,

			horizontalBounce: {
				set: function(value) {
					return this._horizontalElastic = value;
				},
				value: true
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
			},

			verticalBounce: {
				set: function(value) {
					return this._verticalElastic = value;
				},
				value: true
			}
		}

	});

});