define("Ti/UI/Button", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/style"], function(declare, FontWidget, dom, style) {

	var setStyle = style.set,

		// Measure the size of an empty button to determine the extra padding
		body = document.body,
		buttonRuler = dom.create("button", null, body),
		buttonHorizontalPadding = buttonRuler.clientWidth,
		buttonVerticalPadding = buttonRuler.clientHeight;

	dom.destroy(buttonRuler);

	return declare("Ti.UI.Button", FontWidget, {

		domType: "button",

		constructor: function() {
			this.contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center"
				}
			}, this.domNode);

			this.buttonImage = dom.create("img", {
				className: "TiUIButtonImage"
			}, this.contentContainer);

			this.buttonTitle = dom.create("div", {
				className: "TiUIButtonTitle",
				style: {
					whiteSpace: "nowrap"
				}
			}, this.contentContainer);

			this._addStyleableDomNode(this.buttonTitle);
		},

		_defaultWidth: "auto",

		_defaultHeight: "auto",

		_getContentWidth: function() {
			return this.buttonImage.width + this._measureText(this.title, this.buttonTitle).width + buttonHorizontalPadding;
		},

		_getContentHeight: function() {
			return this.buttonImage.height + this._measureText(this.title, this.buttonTitle).height + buttonVerticalPadding;
		},

		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this.contentContainer, "pointerEvents", cssVal);
			setStyle(this.buttonImage, "pointerEvents", cssVal);
			setStyle(this.buttonTitle, "pointerEvents", cssVal);
		},

		properties: {			
			color: {
				set: function(value) {
					setStyle(this.buttonTitle, "color", value);
					return value;
				}
			},
			image: {
				set: function(value) {
					this.buttonImage.src = value;
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
			title: {
				set: function(value) {
					this.buttonTitle.innerHTML = value;
					this._hasAutoDimensions() && Ti.UI._doFullLayout();
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