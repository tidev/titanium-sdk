define("Ti/UI/ImageView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {
		
	var set = style.set;

	return declare("Ti.UI.ImageView", Widget, {
		
		constructor: function() {
			this.imageDisplay = dom.create("img", {
				className: css.clean("TiUIImageDisplay")
			});
			this.domNode.appendChild(this.imageDisplay);
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
			setTimeout(lang.hitch(this, function(){
				if (this.canScale) {
					var controlRatio = this.domNode.clientWidth / this.domNode.clientHeight,
						imageRatio = this.imageDisplay.width / this.imageDisplay.height;
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
			}),0);
		},

		properties: {
			animating: false,
			canScale: {
				set: function(value, oldValue){
					if (value !== oldValue) {
						this.doLayout();
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
						this.doLayout();
					}));
					tempImage.src = value;
					return value;
				}
			},
			images: {
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.images" is not implemented yet.');
					return value;
				}
			},
			paused: false,
			preventDefaultImage: false,
			repeatCount: 0,
			reverse: false
		}

	});

});