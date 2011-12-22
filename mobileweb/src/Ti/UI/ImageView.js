define("Ti/UI/ImageView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {

	return declare("Ti.UI.ImageView", Widget, {
		
		constructor: function() {
			this.imageDisplay = dom.create("img", {
				className: css.clean("TiUIImageDisplay")
			});
			this.domNode.appendChild(this.imageDisplay);
			style.set(this.imageDisplay, "width", "100%");
			style.set(this.imageDisplay, "height", "100%");
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

		properties: {
			animating: false,
			canScale: {
				set: function(value){
					value = !!value;
					if (!value) {
						style.set(this.imageDisplay, "width", "auto");
						style.set(this.imageDisplay, "height", "auto");
					} else {
						style.set(this.imageDisplay, "width", "100%");
						style.set(this.imageDisplay, "height", "100%");
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