define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/Locale", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, Locale, UI) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
		titlePost = {
			post: "_updateTitle"
		};

	return declare("Ti.UI.Button", FontWidget, {

		constructor: function() {
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center",
					pointerEvents: "none",
					width: "100%",
					height: "100%"
				}
			}, this.domNode);

			this._buttonImage = dom.create("img", {
				className: "TiUIButtonImage",
				style: {
					pointerEvents: "none"
				}
			}, this._contentContainer);

			this._buttonTitle = dom.create("div", {
				className: "TiUIButtonTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					userSelect: "none"
				}
			}, this._contentContainer);

			this._addStyleableDomNode(this._buttonTitle);
			
			this._setDefaultLook();
			
			this.addEventListener("touchstart",function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.selectedColor);
				}
			});
			this.addEventListener("touchend",function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.color || "black");
				}
			});
			this.domNode.addEventListener("mouseout",lang.hitch(this,function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.color || "black");
				}
			}));
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_updateLook: function() {
			if (this.backgroundColor || this.backgroundDisabledColor || this.backgroundDisabledImage || this.backgroundFocusedColor || 
				this.backgroundFocusedImage || this.backgroundImage || this.backgroundSelectedColor || this.backgroundSelectedImage) {
				this._clearDefaultLook();
			} else {
				this._setDefaultLook();
			}
			this._doBackground();
		},
		
		_setDefaultLook: function() {
			if (!this._hasDefaultLook) {
				this._hasDefaultLook = true;
				css.add(this.domNode, "TiUIElementGradient");
				css.add(this.domNode, "TiUIButtonDefault");
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				css.remove(this.domNode, "TiUIElementGradient");
				css.remove(this.domNode, "TiUIButtonDefault");
			}
		},
		
		_getContentSize: function(width, height) {
			return {
				width: this._buttonImage.width + this._measureText(this.title, this._buttonTitle).width,
				height: Math.max(this._buttonImage.height, this._measureText(this.title, this._buttonTitle).height)
			};
		},

		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this._contentContainer, "pointerEvents", cssVal);
			setStyle(this._buttonImage, "pointerEvents", cssVal);
			setStyle(this._buttonTitle, "pointerEvents", cssVal);
		},

		_updateTitle: function() {
			this._buttonTitle.innerHTML = Locale._getString(this.titleid, this.title);
			this._hasSizeDimensions() && this._triggerLayout();
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
					require.on(this._buttonImage, "load", lang.hitch(this, function () {
						this._hasSizeDimensions() && this._triggerLayout();
					}));
					this._buttonImage.src = value;
					return value;
				}
			},
			selectedColor: void 0,
			textAlign: {
				set: function(value) {
					setStyle(this._contentContainer, "boxPack", value === UI.TEXT_ALIGNMENT_LEFT ? "start" : value === UI.TEXT_ALIGNMENT_RIGHT ? "end" : "center");
					return value;
				}
			},
			title: titlePost,
			titleid: titlePost,
			verticalAlign: {
				set: function(value) {
					setStyle(this._contentContainer, "boxAlign", value === UI.TEXT_VERTICAL_ALIGNMENT_TOP ? "start" : value === UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM ? "end" : "center");
					return value;
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}
		}

	});

});