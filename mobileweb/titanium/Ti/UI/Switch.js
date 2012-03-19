define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, UI) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
        unitize = dom.unitize;

	return declare("Ti.UI.Switch", FontWidget, {

		constructor: function(args) {
			
			// This container holds the flex boxes used to position the elements
			this._contentContainer = dom.create("div", {
				className: "TiUISwitchContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "stretch",
					width: "100%",
					height: "100%"
				}
			}, this.domNode)
			
			// Create the text box and a flex box to align it
			this._titleContainer = dom.create("div", {
				className: "TiUISwitchTextAligner",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "center",
					boxFlex: 1
				}
			}, this._contentContainer);
			this._switchTitle = dom.create("div", {
				className: "TiUISwitchTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					textAlign: "center"
				}
			}, this._titleContainer);
			this._addStyleableDomNode(this._switchTitle);

			// Create the switch indicator and a flex box to contain it
			this._indicatorContainer = dom.create("div", {
				className: "TiUISwitchTextAligner",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxPack: "center",
					boxAlign: "center",
					marginTop: "3px"
				}
			}, this._contentContainer);
			this._switchIndicator = dom.create("div", {
				className: "TiUISwitchIndicator",
				style: {
					padding: "4px 4px",
					borderRadius: "4px",
					border: "1px solid #888",
					pointerEvents: "none",
					width: "40px"
				}
			}, this._indicatorContainer);
			this._switchIndicator.domNode += " TiUISwitchIndicator";
			
			// Set the default look
			this._setDefaultLook();
			var self = this;
			self.addEventListener("singletap",function(){
				self.value = !self.value;
			});
			
			this.value = false;
		},
		
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
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				this.borderWidth = 1;
				this.borderColor = "#666";
				setStyle(this.domNode, { 
					borderRadius: "6px",
					padding: "6px 6px"
				});
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				var className = this.domNode.className;
				css.remove(this.domNode, "TiUIElementGradient");
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
				setStyle(this.domNode, { 
					borderRadius: "",
					padding: ""
				});
			}
		},
		
		_getContentSize: function(width, height) {
			var defaultLookOffset = (this._hasDefaultLook ? 12 : 0);
			return {
				width: Math.max(this._measureText(this._switchTitle.innerHTML, this._switchTitle).width, this._switchIndicator.offsetWidth) + defaultLookOffset,
				height: this._measureText(this._switchTitle.innerHTML, this._switchTitle).height + // Text height
						this._switchIndicator.offsetHeight + // Indicator height
						3 + // Padding between the indicator and text
						defaultLookOffset // Border of the default style
			};
		},
		
		_defaultWidth: UI.SIZE,
		
        _defaultHeight: UI.SIZE,

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
			
			textAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxAlign", cssValue);
					return value;
				}
			},
			
			titleOff: {
				set: function(value) {
					if (!this.value) {
						this._switchTitle.innerHTML = value;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				value: "Off"
			},
			
			titleOn: {
				set: function(value) {
					if (this.value) {
						this._switchTitle.innerHTML = value;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				value: "On"
			},
			
            value: {
				set: function(value) {
					setStyle(this._switchIndicator,{
						backgroundColor: value ? "#0f0" : "#aaa"
					});
					value = !!value;
					this._switchTitle.innerHTML = value ? this.titleOn : this.titleOff;
					this._hasSizeDimensions() && this._triggerLayout();
					return value;
				},
				post: function() {
					this.fireEvent("change",{
						value: this.value
					});
				}
			},
			
			verticalAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxPack", cssValue);
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}

		}

	});

});
