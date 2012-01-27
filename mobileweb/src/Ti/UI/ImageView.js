define("Ti/UI/ImageView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {
		
	var set = style.set;

	return declare("Ti.UI.ImageView", Widget, {
		
		constructor: function() {
			
			this.contentContainer = dom.create("div", {
				className: css.clean("TiUIImageViewAligner")
			});
			set(this.contentContainer, "width", "100%");
			set(this.contentContainer, "height", "100%");
			set(this.contentContainer, "display", "-webkit-box");
			set(this.contentContainer, "display", "-moz-box");
			set(this.contentContainer, "boxOrient", "horizontal");
			set(this.contentContainer, "boxPack", "center");
			set(this.contentContainer, "boxAlign", "center");
			this.domNode.appendChild(this.contentContainer);
			
			this.imageDisplay = dom.create("img", {
				className: css.clean("TiUIImageViewDisplay")
			});
			this.contentContainer.appendChild(this.imageDisplay);
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
			Widget.prototype.doLayout.apply(this,arguments);
			if (this.canScale) {
				var controlRatio = this._measuredWidth / this._measuredHeight,
					imageRatio = this._getContentWidth() / this._getContentHeight();
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

		_defaultWidth: "auto",
		_defaultHeight: "auto",
		_getContentWidth: function() {
			return this.imageDisplay.width;
		},
		_getContentHeight: function() {
			return this.imageDisplay.height;
		},
		_setTouchEnabled: function(value) {
			Widget.prototype._setTouchEnabled.apply(this,arguments);
			var cssVal = value ? "auto" : "none";
			this.contentContainer && set(this.contentContainer,"pointerEvents", cssVal);
			this.imageDisplay && set(this.imageDisplay,"pointerEvents", cssVal);
		},
		
		properties: {
			animating: false,
			canScale: {
				set: function(value, oldValue){
					if (value !== oldValue) {
						this._hasAutoDimensions() && Ti.UI._doFullLayout();
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
						this._hasAutoDimensions() && Ti.UI._doFullLayout();
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