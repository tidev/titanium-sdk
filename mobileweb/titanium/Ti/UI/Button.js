define(['Ti/_/declare', 'Ti/_/UI/Widget', 'Ti/_/dom', 'Ti/_/css', 'Ti/_/style', 'Ti/_/lang', 'Ti/Locale', 'Ti/UI'],
	function(declare, Widget, dom, css, style, lang, Locale, UI) {

	var on = require.on,
		setStyle = style.set,
		postDoBackground = {
			post: function() {
				if (this.backgroundColor || this.backgroundDisabledColor || this.backgroundDisabledImage || this.backgroundFocusedColor ||
					this.backgroundFocusedImage || this.backgroundImage || this.backgroundSelectedColor || this.backgroundSelectedImage) {
					this._clearDefaultLook();
				} else {
					this._setDefaultLook();
				}
				this._doBackground();
			}
		},
		titlePost = {
			post: function() {
				var text = Locale._getString(this.titleid, this.title);
				//For platform consistency, covert leading spaces to non-breaking
				this._buttonTitle.text = text.replace(/^[ \t]+/gm, function(x){ return new Array(x.length + 1).join('&nbsp;') });
				this._hasSizeDimensions() && this._triggerLayout();
			}
		};

	return declare('Ti.UI.Button', Widget, {

		constructor: function() {
			var contentContainer = this._contentContainer = UI.createView({
					width: UI.INHERIT,
					height: UI.INHERIT,
					layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL,
					borderColor: 'transparent'
				}),
				node = this.domNode;

			this._add(contentContainer);

			contentContainer._add(this._buttonImage = UI.createImageView());
			contentContainer._add(this._buttonTitle = UI.createLabel({
				textAlign: UI.TEXT_ALIGNMENT_CENTER,
				verticalAlign: UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
				width: UI.INHERIT,
				height: UI.INHERIT
			}));

			this._setDefaultLook();

			on(this, 'touchstart', this, function() {
				if (this._hasDefaultLook) {
					css.remove(node, 'TiUIElementGradient');
					css.add(node, 'TiUIElementGradientActive');
				} else {
					this.selectedColor && (this._buttonTitle.color = this.selectedColor);
					this.backgroundSelectedColor && setStyle(this.domNode,'backgroundColor',this.backgroundSelectedColor);
				}
			});
			on(this, 'touchend', this, function() {
				if (this._hasDefaultLook) {
					css.remove(node, 'TiUIElementGradientActive');
					css.add(node, 'TiUIElementGradient');
				} else {
					this.selectedColor && (this._buttonTitle.color = this.color || '#000');
					this.backgroundSelectedColor && setStyle(this.domNode,'backgroundColor',this.backgroundColor);
				}
			});
			on(node, 'mouseout', this, function() {
				this.selectedColor && (this._buttonTitle.color = this.color || '#000');
			});
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_setDefaultLook: function() {
			if (!this._hasDefaultLook) {
				this._hasDefaultLook = true;
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				css.add(this.domNode, 'TiUIElementGradient');
				css.add(this.domNode, 'TiUIButtonDefault');
				this._contentContainer.borderWidth = 6;
				this._getBorderFromCSS();
			}
		},

		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
				css.remove(this.domNode, 'TiUIElementGradient');
				css.remove(this.domNode, 'TiUIButtonDefault');
				this._contentContainer.borderWidth = 0;
			}
		},

		properties: {

			// Override the default background info so we can hook into it
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,

			enabled: {
				set: function(value, oldValue) {

					if (value !== oldValue) {
						if (this._hasDefaultLook) {
							if (!value) {
								css.remove(this.domNode,'TiUIElementGradient');
								setStyle(this.domNode,'backgroundColor','#aaa');
							} else {
								css.add(this.domNode,'TiUIElementGradient');
								setStyle(this.domNode,'backgroundColor','');
							}
						}
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},
			font : {
				set : function(value) {
					this._buttonTitle.font = value;
					return value;
				}
			},
			image: {
				set: function(value) {
					this._buttonImage.image = value;
					return value;
				}
			},
			shadowColor: {
				post: function (value) {
					this._buttonTitle.shadowColor = value;
				}
			},
			shadowOffset: {
				post: function (value) {
					this._buttonTitle.shadowOffset = value;
				}
			},
			shadowRadius: {
				post: function (value) {
					this._buttonTitle.shadowRadius = value;
				}
			},
			selectedColor: void 0,
			textAlign: {
				set: function(value) {
					return this._buttonTitle.textAlign = value;
				}
			},
			title: titlePost,
			titleid: titlePost,
			verticalAlign: {
				set: function(value) {
					return this._buttonTitle.verticalAlign = value;
				}
			}
		}

	});

});