define("Ti/UI/Button", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {
	
	var set = style.set,
		undef;
	
	return declare("Ti.UI.Button", Widget, {
		
		constructor: function(args) {
			this.button = dom.create("button", {
				className: css.clean("TiUIButtonButton")
			});
			this.domNode.appendChild(this.button);
			set(this.button,"width","100%");
			set(this.button,"height","100%");
			
			this.contentContainer = dom.create("div", {
				className: css.clean("TiUIButtonContentContainer")
			});
			this.button.appendChild(this.contentContainer)
			style.set(this.contentContainer, "display", "-webkit-box");
			style.set(this.contentContainer, "display", "-moz-box");
			style.set(this.contentContainer, "boxOrient", "horizontal");
			style.set(this.contentContainer, "boxPack", "center");
			style.set(this.contentContainer, "boxAlign", "center");
			
			this.buttonImage = dom.create("img", {
				className: css.clean("TiUIButtonImage")
			});
			this.contentContainer.appendChild(this.buttonImage);
			
			this.buttonTitle = dom.create("div", {
				className: css.clean("TiUIButtonTitle")
			});
			this.contentContainer.appendChild(this.buttonTitle);
		},

		properties: {
			backgroundColor: {
				set: function(value) {
					this.button.style.color = value;
					return value;
				}
			},
			backgroundImage: {
				set: function(value) {
					return style.set(this.button, "backgroundImage", value ? style.url(value) : "");
				}
			},
			backgroundLeftCap: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.backgroundLeftCap" is not implemented yet.');
					return value;
				}
			},
			backgroundTopCap: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.backgroundTopCap" is not implemented yet.');
					return value;
				}
			},
			color: {
				set: function(value) {
					this.buttonTitle.style.color = value;
					return value;
				}
			},
			enabled: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.enabled" is not implemented yet.');
					return value;
				},
				value: true
			},
			"font-family": {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.font-family" is not implemented yet.');
					return value;
				}
			},
			"font-size": {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.font-size" is not implemented yet.');
					return value;
				}
			},
			"font-style": {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.font-style" is not implemented yet.');
					return value;
				}
			},
			"font-weight": {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.font-weight" is not implemented yet.');
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
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.selectedColor" is not implemented yet.');
					return value;
				}
			},
			style: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.style" is not implemented yet.');
					return value;
				}
			},
			title: {
				set: function(value) {
					this.buttonTitle.innerHTML = value;
					return value;
				}
			},
			titleid: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.titleid" is not implemented yet.');
					return value;
				}
			},
			touchEnabled: {
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.touchEnabled" is not implemented yet.');
					return value;
				},
				value: true
			}
		}

	});

});