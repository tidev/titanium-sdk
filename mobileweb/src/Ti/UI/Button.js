define("Ti/UI/Button", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, FontWidget, dom, css, style) {
	
	var set = style.set,
		undef;
		
	function arrayContains(array,object) {
		for (var i in array) {
			if (array[i] == object) {
				return true;
			}
		}
		return false;
	}
	
	return declare("Ti.UI.Button", FontWidget, {
		
		constructor: function(args) {
			
			set(this.domNode, "backgroundSize","100% 100%");
			set(this.domNode, "backgroundRepeat","no-repeat");
			
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
			set(this.contentContainer, "display", "-webkit-box");
			set(this.contentContainer, "display", "-moz-box");
			set(this.contentContainer, "boxOrient", "horizontal");
			set(this.contentContainer, "boxPack", "center");
			set(this.contentContainer, "boxAlign", "center");
			
			this.buttonImage = dom.create("img", {
				className: css.clean("TiUIButtonImage")
			});
			this.contentContainer.appendChild(this.buttonImage);
			
			this.buttonTitle = dom.create("div", {
				className: css.clean("TiUIButtonTitle")
			});
			this.contentContainer.appendChild(this.buttonTitle);
			this._addStyleableDomNode(this.buttonTitle);
		},

		properties: {
			_defaultWidth: "auto",
			_defaultHeight: "auto",
			backgroundColor: {
				set: function(value) {
					set(this.button,"color",value);
					return value;
				}
			},
			backgroundImage: {
				set: function(value) {
					if (value) {
						set(this.domNode, "backgroundImage", value ? style.url(value) : "");
						if (arrayContains(this.domNode.children, this.button)) {
							this.domNode.removeChild(this.button);
							this.domNode.appendChild(this.contentContainer);
						}
					} else {
						set(this.domNode, "backgroundImage", "");
						if (arrayContains(this.domNode.children, this.contentContainer)) {
							this.domNode.removeChild(this.contentContainer);
							this.domNode.appendChild(this.button);
						}
					}
					return value;
				}
			},
			backgroundLeftCap: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.backgroundLeftCap" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.backgroundLeftCap" is not implemented yet.');
					return value;
				}
			},
			backgroundTopCap: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.backgroundTopCap" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.backgroundTopCap" is not implemented yet.');
					return value;
				}
			},
			color: {
				set: function(value) {
					set(this.buttonTitle,"color",value);
					return value;
				}
			},
			enabled: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.enabled" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.enabled" is not implemented yet.');
					return value;
				},
				value: true
			},
			"font-family": {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.font-family" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.font-family" is not implemented yet.');
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
			},
			touchEnabled: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Button#.touchEnabled" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Button#.touchEnabled" is not implemented yet.');
					return value;
				},
				value: true
			}
		}

	});

});