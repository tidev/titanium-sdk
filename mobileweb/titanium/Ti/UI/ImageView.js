define(["Ti/_/declare", "Ti/_/lang", "Ti/_/style", "Ti/_/UI/Widget", "Ti/UI"], 
	function(declare, lang, style, Widget, UI) {

	var setStyle = style.set,
		on = require.on,
		InternalImageView = declare(Widget, {

			domType: "img",
			onload: null,
			onerror: null,

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
				// We have to remove the old style to get the image to scale to its default size,
				// otherwise we are just reading in whatever we set in the last doLayout(), which is
				// 0 if the image was not loaded...thus always clamping it to 0.
				this.domNode.style.width = "";
				this.domNode.style.height = "";
				
				var imageRatio = this.domNode.width / this.domNode.height,
					boundingHeight = params.boundingSize.height,
					boundingWidth = params.boundingSize.width,
					values = this.properties.__values__,
					isParentWidthSize = params.isParentSize.width,
					isParentHeightSize = params.isParentSize.height;

				function setByHeight() {
					values.width = boundingHeight * imageRatio;
					values.height = boundingHeight;
				}

				function setByWidth() {
					values.width = boundingWidth;
					values.height = boundingWidth / imageRatio;
				}

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
					values.width = UI.SIZE;
					values.height = UI.SIZE;
				}

				return Widget.prototype._doLayout.call(this,params);
			},

			properties: {
				src: {
					set: function(value) {
						var node = this.domNode,
							disp = "none";
							onerror = lang.hitch(this, function(e) {
								this._triggerLayout();
								this.onerror && this.onerror(e);
							});

						if (value) {
							disp = "inherit";
							on(node, "load", this, function() {
								this.container._triggerLayout();
								this.onload && this.onload();
							});
							on(node, "error", onerror);
							on(node, "abort", onerror);
							node.src = require.cache(value) || value;
						}

						setStyle(node, "display", disp);
						return value;
					}
				}
			}
		});

	return declare("Ti.UI.ImageView", Widget, {

		_createImage: function(src, onload, onerror) {
			switch (src && src.declaredClass) {
				case "Ti.Filesystem.File":
					src = src.read();
				case "Ti.Blob":
					src = src.toString();
			}
			return new InternalImageView({
				onload: onload,
				onerror: onerror,
				src: src,
				container: this
			});
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_slideshowCount: 0,

		_setSlideshowInterval: function() {
			var self = this,
				imgs = self._images;
			clearInterval(this._slideshowTimer);

			this._slideshowTimer = setInterval(function(){
				var rollover = false;

				setStyle(imgs[self._currentIndex].domNode, "display", "none");

				if (self.reverse) {
					if (--self._currentIndex === 0) {
						self._currentIndex = self.images.length - 1;
						rollover = true;
					}
				} else if (++self._currentIndex === self.images.length) {
					self._currentIndex = 0;
					rollover = true;
				}

				setStyle(imgs[self._currentIndex].domNode, "display", "inherit");

				if (self.repeatCount && rollover && ++self._slideshowCount === self.repeatCount) {
					self.stop();
					return;
				}

				self.fireEvent("change", {
					index: self._currentIndex
				});
			}, this.duration);
		},

		start: function(){
			if (this._images) {
				this._setState(1, 0);
				this._slideshowCount = 0;
				this._setSlideshowInterval();
				this.fireEvent("start");
			}
		},

		stop: function(){
			var imgs = this._images;
			if (imgs) {
				clearInterval(this._slideshowTimer);
				if (imgs.length) {
					var start = 0;
					this.reverse && (start = imgs.length - 1);
					this._currentIndex && setStyle(imgs[this._currentIndex].domNode, "display", "none");
					setStyle(imgs[start].domNode, "display", "inherit");
					this._currentIndex = start;
				}
				this._setState(0, 0);
				this.fireEvent("stop");
			}
		},

		pause: function(){
			if (this._images) {
				clearInterval(this._slideshowTimer);
				this._setState(1, 0);
				this.fireEvent("pause");
			}
		},

		resume: function() {
			if (this._images) {
				this._setSlideshowInterval();
				this._setState(0, 1);
			}
		},

		_setState: function(paused, animating) {
			this.constants.paused = !!paused;
			this.constants.animating = !!animating;
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
					this._images = void 0;
					this.add(this._createImage(value, function() {
						this.fireEvent("load", {
							state: "image"
						});
					}, function(e) {
						this.fireEvent("error", e);
					}));
					return value;
				}
			},

			images: {
				set: function(value) {
					var imgs = void 0,
						counter = 0,
						errored = 0;
					this._removeAllChildren();
					if (require.is(value, "Array")) {
						imgs = [];
						value.forEach(function(val) {
							var img = this._createImage(val, function() {
								!errored && ++counter === value.length && this.fireEvent("load", {
									state: "image"
								});
							}, function(e) {
								errored || (errored = 1) && this.fireEvent("error", e);
							});
							setStyle(img.domNode, "display", "none");
							imgs.push(img);
							this.add(img);
						}, this);
					}
					this._images = imgs;
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