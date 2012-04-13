define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, UI) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
        unitize = dom.unitize;

	return declare("Ti.UI.Switch", FontWidget, {

		constructor: function(args) {
			
			var contentContainer = this._contentContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT,
				layout: "vertical",
				borderColor: "transparent"
			});
			contentContainer._forceInheritenceToFillOrSize = true;
			this._add(contentContainer);
			
			contentContainer._add(this._switchTitle = UI.createLabel({
				width: UI.INHERIT,
				height: UI.INHERIT,
				verticalAlign: UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));
			this._switchTitle._forceInheritenceToFillOrSize = true;
			
			contentContainer._add(this._switchIndicator = UI.createView({
				width: 40,
				height: 10,
				borderRadius: 4,
				borderWidth: 1,
				borderColor: "#888"
			}));
			
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
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				css.add(this.domNode, "TiUIElementGradient");
				css.add(this.domNode, "TiUIButtonDefault");
				this._contentContainer.borderWidth = 6;
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
					this._switchTitle.textAlign = value;
					return value;
				}
			},
			
			titleOff: {
				set: function(value) {
					if (!this.value) {
						this._switchTitle.text = value;
					}
					return value;
				},
				value: "Off"
			},
			
			titleOn: {
				set: function(value) {
					if (this.value) {
						this._switchTitle.text = value;
					}
					return value;
				},
				value: "On"
			},
			
            value: {
				set: function(value) {
					this._switchIndicator.backgroundColor = value ? "#0f0" : "#aaa";
					value = !!value;
					this._switchTitle.text = value ? this.titleOn : this.titleOff;
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
					this._switchTitle.verticalAlign = value;
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}

		}

	});

});
