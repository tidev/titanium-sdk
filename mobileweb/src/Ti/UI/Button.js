define("Ti/UI/Button", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/style", "Ti/_/lang"], function(declare, FontWidget, dom, style, lang) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		};

	return declare("Ti.UI.Button", FontWidget, {

		domType: "button",

		constructor: function() {
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center"
				}
			}, this.domNode);

			this._buttonImage = dom.create("img", {
				className: "TiUIButtonImage"
			}, this._contentContainer);

			this._buttonTitle = dom.create("div", {
				className: "TiUIButtonTitle",
				style: {
					whiteSpace: "nowrap"
				}
			}, this._contentContainer);

			this._addStyleableDomNode(this._buttonTitle);
			
			this._setDefaultLook();
		},

		_defaultWidth: "auto",

		_defaultHeight: "auto",
		
		backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,
		
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
				this.domNode.className += " TiUIButtonDefault";
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				this.borderWidth = 1;
				this.borderColor = "#aaa";
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				var className = this.domNode.className;
				this.domNode.className = className.substring(0,className.length - " TiUIButtonDefault".length);
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
			}
		},

		_getContentWidth: function() {
			return this._buttonImage.width + this._measureText(this.title, this._buttonTitle).width + (this._hasDefaultLook ? 20 : 0);
		},

		_getContentHeight: function() {
			return this._buttonImage.height + this._measureText(this.title, this._buttonTitle).height + (this._hasDefaultLook ? 20 : 0);
		},

		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this._contentContainer, "pointerEvents", cssVal);
			setStyle(this._buttonImage, "pointerEvents", cssVal);
			setStyle(this._buttonTitle, "pointerEvents", cssVal);
		},

		properties: {
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,
			
			color: {
				set: function(value) {
					setStyle(this._buttonTitle, "color", value);
					return value;
				}
			},
			image: {
				set: function(value) {
					require.on(this._buttonImage, "load", lang.hitch(this, function () {
						this._hasAutoDimensions() && this._triggerLayout();
					}));
					this._buttonImage.src = value;
					return value;
				}
			},
			selectedColor: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.selectedColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.selectedColor" is not implemented yet.');
					return value;
				}
			},
			style: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.style" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.style" is not implemented yet.');
					return value;
				}
			},
			textAlign: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.textAlign" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.textAlign" is not implemented yet.');
					/*var cssValue = "";
					switch(value) {
						case Ti.UI.TEXT_ALIGNMENT_LEFT: cssValue = "left"; break;
						case Ti.UI.TEXT_ALIGNMENT_CENTER: cssValue = "center"; break;
						case Ti.UI.TEXT_ALIGNMENT_RIGHT: cssValue = "right"; break;
					}
					this.textContainerDiv.style.textAlign = cssValue;*/
					return value;
				}
			},
			title: {
				set: function(value) {
					this._buttonTitle.innerHTML = value;
					this._hasAutoDimensions() && this._triggerParentLayout();
					return value;
				}
			},
			titleid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.titleid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.titleid" is not implemented yet.');
					return value;
				}
			}
		}

	});

});