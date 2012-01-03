define("Ti/UI/ImageView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {
		
	var set = style.set;

	return declare("Ti.UI.ImageView", Widget, {
		
		constructor: function() {
			
			var container = dom.create("div", {
				className: css.clean("TiUIImageViewAligner")
			});
			set(container, "width", "100%");
			set(container, "height", "100%");
			set(container, "display", "-webkit-box");
			set(container, "display", "-moz-box");
			set(container, "boxOrient", "horizontal");
			set(container, "boxPack", "center");
			set(container, "boxAlign", "center");
			this.domNode.appendChild(container);
			
			this.imageDisplay = dom.create("img", {
				className: css.clean("TiUIImageViewDisplay")
			});
			container.appendChild(this.imageDisplay);
			set(this.imageDisplay, "width", "100%");
			set(this.imageDisplay, "height", "100%");
		},
		
		pause: function(){
			console.debug('Method "Titanium.UI.ImageView#.pause" is not implemented yet.');
		},
		start: function(){
			console.debug('Method "Titanium.UI.ImageView#.start" is not implemented yet.');
		},
		stop: function(){
			console.debug('Method "Titanium.UI.ImageView#.stop" is not implemented yet.');
		},
		toBlob: function(){
			console.debug('Method "Titanium.UI.ImageView#.toBlob" is not implemented yet.');
		},
		
		doLayout: function() {
			Widget.prototype.doLayout.apply(this);
			if (this.canScale) {
				var controlRatio = this._measuredWidth / this._measuredHeight,
					imageRatio = this._contentWidth / this._contentHeight;
				if (controlRatio > imageRatio) {
					set(this.imageDisplay,"width","auto");
					set(this.imageDisplay,"height","100%");
				} else {
					set(this.imageDisplay,"width","100%");
					set(this.imageDisplay,"height","auto");
				}
			} else {
				set(this.imageDisplay,"width","auto");
				set(this.imageDisplay,"height","auto");
			}
		},

		properties: {
			_defaultWidth: "auto",
			_defaultHeight: "auto",
			_contentWidth: {
				get: function(value) {
					return this.imageDisplay.width;
				},
				set: function(value) {
					return this.imageDisplay.width;
				}
			},
			
			_contentHeight: {
				get: function(value) {
					return this.imageDisplay.height;
				},
				set: function(value) {
					return this.imageDisplay.height;
				}
			},
			animating: false,
			canScale: {
				set: function(value, oldValue){
					if (value !== oldValue) {
						Ti.UI._doFullLayout();
					}
					return value;
				},
				value: true
			},
			defaultImage: null,
			duration: 0,
			image: {
				set: function(value) {
					this.defaultImage && (this.imageDisplay.src = value);
					var tempImage = new Image();
					require.on(tempImage, "load", lang.hitch(this, function () {
						this.imageDisplay.src = value;
						
						// Force a layout to take the image size into account
						Ti.UI._doFullLayout();
					}));
					tempImage.src = value;
					return value;
				}
			},
			images: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.images" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.images" is not implemented yet.');
					return value;
				}
			},
			paused: false,
			preventDefaultImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.preventDefaultImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.preventDefaultImage" is not implemented yet.');
					return value;
				}
			},
			repeatCount: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.repeatCount" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.repeatCount" is not implemented yet.');
					return value;
				}
			},
			reverse: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.reverse" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.reverse" is not implemented yet.');
					return value;
				}
			}
		}

	});

});