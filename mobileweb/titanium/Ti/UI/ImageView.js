define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {
		
	var set = style.set,
		internalImageView = (declare(Widget, {
			
			domType: "img",
			
			constructor: function() {
				this.domNode.ondragstart = function() { return false; }; // Prevent images from being dragged
			},
			
			_getContentSize: function() {
				return {
					width: this.domNode.width,
					height: this.domNode.height
				}
			},
			
			_doLayout: function(originX, originY, parentWidth, parentHeight, centerHDefault, centerVDefault, isParentAutoWidth, isParentAutoHeight) {
				var imageRatio = this.domNode.width / this.domNode.height,
					self = this;
				
				function setByHeight() {
					self.properties.__values__.width = parentHeight * imageRatio;
					self.properties.__values__.height = parentHeight;
				}
				
				function setByWidth() {
					self.properties.__values__.width = parentWidth;
					self.properties.__values__.height = parentWidth / imageRatio;
				}
				
				if (!isParentAutoWidth && !isParentAutoHeight) {
					if (parentWidth / parentHeight > imageRatio) {
						setByHeight();
					} else {
						setByWidth();
					}
				} else if (!isParentAutoWidth) {
					setByWidth();
				} else if (!isParentAutoHeight) {
					setByHeight();
				} else {
					this.properties.__values__.width = "auto";
					this.properties.__values__.height = "auto";
				}
				Widget.prototype._doLayout.apply(this,arguments);
			},
			
			properties: {
				src: {
					set: function(value) {
						this.domNode.src = value;
						require.on(this.domNode,"load", lang.hitch(this, function() {
							this.fireEvent("load", {});
							this._triggerLayout();
						}));
						return value;
					}
				}
			}
		}));

	return declare("Ti.UI.ImageView", Widget, {

		_defaultWidth: "auto",
		
		_defaultHeight: "auto",
		
		pause: function(){
			console.debug('Method "Titanium.UI.ImageView#.pause" is not implemented yet.');
		},
		
		start: function(){
			console.debug('Method "Titanium.UI.ImageView#.start" is not implemented yet.');
		},
		
		stop: function(){
			console.debug('Method "Titanium.UI.ImageView#.stop" is not implemented yet.');
		},
		
		resume: function() {
			console.debug('Method "Titanium.UI.ImageView#.resume" is not implemented yet.');
		},
		
		properties: {
			
			animating: {
				get: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.animating" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.animating" is not implemented yet.');
					return value;
				}
			},
			
			defaultImage: {
				get: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.defaultImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.defaultImage" is not implemented yet.');
					return value;
				}
			},
			
			duration: {
				get: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.duration" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ImageView#.duration" is not implemented yet.');
					return value;
				}
			},
			
			image: {
				set: function(value) {
					this.add(new internalImageView({src: value}));
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
			
			paused: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.paused" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ImageView#.paused" is not implemented yet.');
					return value;
				}
			},
			
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