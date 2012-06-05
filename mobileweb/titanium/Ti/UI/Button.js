define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/Locale", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, Locale, UI) {

	var setStyle = style.set,
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
				this._buttonTitle.text = Locale._getString(this.titleid, this.title);
				this._hasSizeDimensions() && this._triggerLayout();
			}
		};

	return declare("Ti.UI.Button", FontWidget, {

		constructor: function() {
			var contentContainer = this._contentContainer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				layout: UI._LAYOUT_CONSTRAINING_HORIZONTAL,
				borderColor: "transparent"
			});
			this._add(contentContainer);
			contentContainer._add(this._buttonImage = UI.createImageView());
			contentContainer._add(this._buttonTitle = UI.createLabel());
			this._addStyleableDomNode(this._buttonTitle.domNode);
			
			this._setDefaultLook();
			
			this.addEventListener("touchstart",function(){
				if (this.selectedColor) {
					this._buttonTitle.color = this.selectedColor;
				}
			});
			this.addEventListener("touchend",function(){
				if (this.selectedColor) {
					this._buttonTitle.color = this.color || "black";
				}
			});
			this.domNode.addEventListener("mouseout",lang.hitch(this,function(){
				if (this.selectedColor) {
					this._buttonTitle.color = this.color || "black";
				}
			}));
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_setDefaultLook: function() {
			if (!this._hasDefaultLook) {
				this._hasDefaultLook = true;
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				css.add(this.domNode, "TiUIElementGradient");
				css.add(this.domNode, "TiUIButtonDefault");
				this._contentContainer.borderWidth = 6;
				this._getBorderFromCSS();
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
				css.remove(this.domNode, "TiUIElementGradient");
				css.remove(this.domNode, "TiUIButtonDefault");
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
								css.remove(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","#aaa");
							} else {
								css.add(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","");
							}
						}
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},
			
			image: {
				set: function(value) {
					this._buttonImage.image = value;
					return value;
				}
			},
			selectedColor: void 0,
			textAlign: {
				set: function(value) {
					var left,
						right,
						center = this.center || {},
						contentContainer = this._contentContainer;
					switch(value) {
						case UI.TEXT_ALIGNMENT_LEFT: left = 0; break;
						case UI.TEXT_ALIGNMENT_CENTER: center.x = "50%"; break;
						case UI.TEXT_ALIGNMENT_RIGHT: right = 0; break;
					}
					contentContainer.left = left;
					contentContainer.center = center;
					contentContainer.right = right;
					return value;
				}
			},
			title: titlePost,
			titleid: titlePost,
			verticalAlign: {
				set: function(value) {
					var top,
						bottom,
						center = this.center || {},
						contentContainer = this._contentContainer;
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: top = 0; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: center.y = "50%"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: bottom = 0; break;
					}
					contentContainer.top = top;
					contentContainer.center = center;
					contentContainer.bottom = bottom;
					return value;
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}
		}

	});

});