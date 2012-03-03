define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], 
	function(declare, Widget, dom, css, style, lang) {
		
	var setStyle = style.set,
		undef,
		on = require.on,
		InternalImageView = (declare(Widget, {
			
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
			
			_doLayout: function(params) {
				var imageRatio = this.domNode.width / this.domNode.height,
					boundingHeight = params.boundingSize.height,
					boundingWidth = params.boundingSize.width,
					values = this.properties.__values__;
				
				function setByHeight() {
					values.width = boundingHeight * imageRatio;
					values.height = boundingHeight;
				}
				
				function setByWidth() {
					values.width = boundingWidth;
					values.height = boundingWidth / imageRatio;
				}
				
				var isParentWidthSize = params.isParentSize.width,
					isParentHeightSize = params.isParentSize.width;
				if (!isParentWidthSize && !isParentHeightSize) {
					if (boundingWidth / boundingHeight > imageRatio) {
						setByHeight();
					} else {
						setByWidth();
					}
				} else if (!isParentWidthSize) {
					setByWidth();
				} else if (!isParentHeightSize) {
					setByHeight();
				} else {
					values.width = Ti.UI.SIZE;
					values.height = Ti.UI.SIZE;
				}
				Widget.prototype._doLayout.call(this,params);
			},
			
			properties: {
				src: {
					set: function(value) {
						if (value) {
							setStyle(this.domNode,"display", "inherit");
							this.domNode.src = value;
							on(this.domNode,"load", this, function() {
								this.fireEvent("load", {});
								this._triggerLayout();
							});
							on(this.domNode,"error", this, function() {
								this.fireEvent("error", {
									image: value
								});
								this._triggerLayout();
							});
							on(this.domNode,"abort", this, function() {
								this.fireEvent("error", {
									image: value
								});
								this._triggerLayout();
							});
						} else {
							setStyle(this.domNode,"display", "none");
						}
						return value;
					}
				}
			}
		}));

	return declare("Ti.UI.ImageView", Widget, {

		_defaultWidth: Ti.UI.SIZE,
		
		_defaultHeight: Ti.UI.SIZE,
		
		_slideshowCount: 0,
		
		_setSlideshowInterval: function() {
			var self = this;
			clearInterval(this._slideshowTimer);
			this._slideshowTimer = setInterval(function(){
				setStyle(self._images[self._currentIndex].domNode,"display","none");
				var rollover = false;
				if (self.reverse) {
					self._currentIndex--;
					if (self._currentIndex === 0) {
						self._currentIndex = self.images.length - 1;
						rollover = true;
					}
				} else {
					self._currentIndex++;
					if (self._currentIndex === self.images.length) {
						self._currentIndex = 0;
						rollover = true;
					}
				}
				setStyle(self._images[self._currentIndex].domNode,"display","inherit");
				
				if (self.repeatCount > 0 && rollover) {
					self._slideshowCount++;
					if (self._slideshowCount === self.repeatCount) {
						self.stop();
						return;
					}
				}
				
				self.fireEvent("change", {
					index: self._currentIndex
				});
			}, this.duration);
		},
		
		start: function(){
			if (this._images) {
				this.constants.__values__.animating = true;
				this.constants.__values__.paused = false;
				this._slideshowCount = 0;
				this._setSlideshowInterval();
				this.fireEvent("start", {});
			}
		},
		
		stop: function(){
			if (this._images) {
				clearInterval(this._slideshowTimer);
				if (this._images.length > 0) {
					var start = 0;
					if (this.reverse) {
						start = this._images.length - 1;
					}
					this._currentIndex && setStyle(this._images[this._currentIndex].domNode,"display","none");
					setStyle(this._images[start].domNode,"display","inherit");
					this._currentIndex = start;
				}
				this.constants.__values__.animating = false;
				this.constants.__values__.paused = false;
				this.fireEvent("stop", {});
			}
		},
		
		pause: function(){
			if (this._images) {
				clearInterval(this._slideshowTimer);
				this.constants.__values__.paused = true;
				this.constants.__values__.animating = false;
				this.fireEvent("pause", {});
			}
		},
		
		resume: function() {
			if (this._images) {
				this._setSlideshowInterval();
				this.constants.__values__.paused = false;
				this.constants.__values__.animating = true;
			}
		},
		
		constants: {
			
			animating: false, 
			
			paused: false
			
		},
		
		properties: {
			
			duration: 30,
			
			image: {
				set: function(value) {
					this._removeAllChildren();
					this._images = undef;
					var image = new InternalImageView({src: value});
					image.addEventListener("load",lang.hitch(this,function() {
						this.fireEvent("load", {
							state: "image"
						});
					}));
					image.addEventListener("error",lang.hitch(this,function(e) {
						this.fireEvent("error", e);
					}));
					this.add(image);
					return value;
				}
			},
			
			images: {
				set: function(value) {
					this._removeAllChildren();
					this._images = undef;
					if (require.is(value,"Array") && value.length > 0) {
						this._images = [];
						var loadCount = 0,
							errorEncountered = false;
						for(var i in value) {
							var image = new InternalImageView({src: value[i]})
							setStyle(image.domNode,"display","none");
							image.addEventListener("load",lang.hitch(this,function(e) {
								loadCount++;
								if (!errorEncountered && loadCount == value.length) {
									this.fireEvent("load", {
										state: "images"
									});
								}
							}));
							image.addEventListener("error",lang.hitch(this,function(e) {
								this.fireEvent("error", e);
								errorEncountered = true;
							}));
							this._images.push(image);
							this.add(image);
						}
					}
					return value;
				},
				post: function() {
					this.stop();
				}
			},
			
			repeatCount: 0,
			
			reverse: false
		}

	});

});