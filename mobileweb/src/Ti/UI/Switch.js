define("Ti/UI/Switch", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, FontWidget, dom, css, style, lang) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
        undef,
        unitize = dom.unitize;

	return declare("Ti.UI.Switch", FontWidget, {
		
		domType: "button",

		constructor: function(args) {
			
			// This container holds the flex boxes used to position the elements
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "stretch",
					width: "100%",
					height: "100%"
				}
			}, this.domNode)
			
			// Create the text box and a flex box to align it
			this._titleContainer = dom.create("div", {
				className: "TiUIButtonTextAligner",
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
				className: "TiUIButtonTextAligner",
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
			
			// Add the enabled/disabled dimmer
			this._disabledDimmer = dom.create("div", {
				className: "TiUISwitchDisableDimmer",
				style: {
					pointerEvents: "none",
					opacity: 0,
					backgroundColor: "white",
					width: "100%",
					height: "100%",
					position: "absolute",
					top: 0,
					left: 0
				}
			}, this.domNode);
			
			// Set the default look
			this._setDefaultLook();
			this.domNode.addEventListener("click",lang.hitch(this,function(){
				this.value = !this.value;
			}));
			
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
				this.domNode.className += " TiUIButtonDefault";
				setStyle(this.domNode,"padding","6px 6px");
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
				setStyle(this.domNode,"padding",0);
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
				setStyle(this._disabledDimmer,{
					opacity: 0
				});
			}
		},

		_getContentWidth: function() {
			return Math.max(this._measureText(this._switchTitle.innerHTML, this._switchTitle).width, this._switchIndicator.offsetWidth) + (this._hasDefaultLook ? 12 : 0);
		},

		_getContentHeight: function() {
			return this._measureText(this._switchTitle.innerHTML, this._switchTitle).height + // Text height
				this._switchIndicator.offsetHeight + // Indicator height
				3 + // Padding between the indicator and text
				(this._hasDefaultLook ? 12 : 0); // Border of the default style
		},
		
		_defaultWidth: "auto",
		
        _defaultHeight: "auto",

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
			
			color: {
				set: function(value) {
					setStyle(this._switchTitle, "color", value);
					return value;
				}
			},
			
			enabled: {
				set: function(value, oldValue) {
					
					if (value !== oldValue) {
						if (!value) {
							this._oldValue = this.value;
							this.value && (this.value = false);
							this._hasDefaultLook && setStyle(this._disabledDimmer,{
								opacity: 0.5
							});
						} else {
							this.value = this._oldValue;
							this._hasDefaultLook && setStyle(this._disabledDimmer,{
								opacity: 0
							});
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
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxAlign", cssValue);
					return value;
				}
			},
			
			titleOff: {
				set: function(value) {
					if (!this.value) {
						this._switchTitle.innerHTML = value;
						this._hasAutoDimensions() && this._triggerParentLayout();
					}
					return value;
				},
				value: "Off"
			},
			
			titleOn: {
				set: function(value) {
					if (this.value) {
						this._switchTitle.innerHTML = value;
						this._hasAutoDimensions() && this._triggerParentLayout();
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
					this._switchTitle.innerHTML = value ? this.titleOn : this.titleOff;
					this._hasAutoDimensions() && this._triggerParentLayout();
					this.fireEvent("change",{
						value: !!value
					});
					return value;
				}
			},
			
			verticalAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case Ti.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxPack", cssValue);
				},
				value: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			},
		}

	});

});
