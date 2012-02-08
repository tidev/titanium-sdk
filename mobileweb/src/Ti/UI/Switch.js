define("Ti/UI/Switch", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, FontWidget, dom, css, style, lang) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
        undef,
        unitize = dom.unitize,
        minSwitchWidth = 40;

	return declare("Ti.UI.Switch", FontWidget, {
		
		domType: "button",

		constructor: function(args) {
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "stretch",
					pointerEvents: "none",
					width: "100%",
					height: "100%",
					padding: 0,
					margin: 0
				}
			}, this.domNode);
			this._switchTitle = dom.create("div", {
				className: "TiUISwitchTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					textAlign: "center"
				}
			}, this._contentContainer);
			this._addStyleableDomNode(this._switchTitle);

			this._switchIndicator = dom.create("div", {
				className: "TiUISwitchIndicator",
				style: {
					pointerEvents: "none"
				}
			}, this._contentContainer);
			this._switchIndicator.domNode += " TiUISwitchIndicator";
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
			}
		},

		_getContentWidth: function() {
			return Math.max(this._measureText(this._switchTitle.innerHTML, this._switchTitle).width, minSwitchWidth) + (this._hasDefaultLook ? 12 : 0);
		},

		_getContentHeight: function() {
			return this._measureText(this._switchTitle.innerHTML, this._switchTitle).height + this._switchIndicator.offsetHeight + (this._hasDefaultLook ? 12 : 0);
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
			
			// TODO enabled: 
			
			textAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case Ti.UI.TEXT_ALIGNMENT_LEFT: cssValue = "left"; break;
						case Ti.UI.TEXT_ALIGNMENT_CENTER: cssValue = "center"; break;
						case Ti.UI.TEXT_ALIGNMENT_RIGHT: cssValue = "right"; break;
					}
					setStyle(this._switchTitle, "textAlign", cssValue);
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
					setStyle(this._contentContainer, "boxPack", cssValue);
				},
				value: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			},
		}

	});

});
