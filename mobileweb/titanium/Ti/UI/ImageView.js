define(["Ti/_/declare", "Ti/_/event", "Ti/_/lang", "Ti/_/style", "Ti/_/UI/Widget", "Ti/UI", "Ti/Filesystem"],
	function(declare, event, lang, style, Widget, UI, Filesystem) {

	var setStyle = style.set,
		is = require.is,
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

			_preLayout: function(boundingWidth, boundingHeight, isParentWidthSize, isParentHeightSize) {
				// We have to remove the old style to get the image to scale to its default size,
				// otherwise we are just reading in whatever we set in the last doLayout(), which is
				// 0 if the image was not loaded...thus always clamping it to 0.
				this.domNode.style.width = "";
				this.domNode.style.height = "";

				var imageRatio = this.domNode.width / this.domNode.height,
					values = this.__values__.properties,
					oldWidth = values.width,
					oldHeight = values.height;

				if (!isParentWidthSize && !isParentHeightSize) {
					if (boundingWidth / boundingHeight > imageRatio) {
						values.width = boundingHeight * imageRatio;
						values.height = boundingHeight;
					} else {
						values.width = boundingWidth;
						values.height = boundingWidth / imageRatio;
					}
				} else if (!isParentWidthSize) {
					values.width = boundingWidth;
					values.height = boundingWidth / imageRatio;
				} else if (!isParentHeightSize) {
					values.width = boundingHeight * imageRatio;
					values.height = boundingHeight;
				} else {
					values.width = UI.SIZE;
					values.height = UI.SIZE;
				}

				return oldWidth !== values.width || oldHeight !== values.height;
			},

			_imageRatio: 1,

			properties: {
				src: {
					set: function(value) {
						var node = this.domNode,
							disp = "none",
							handles,
							onerror = lang.hitch(this, function(e) {
								event.off(handles);
								this._triggerLayout();
								this.onerror && this.onerror(e);
							});

						if (value) {
							value = value.replace(/^(\/|\.\/)/, '');
							disp = "inherit";
							handles = [
								on(node, "load", this, function() {
									node.style.width = "";
									node.style.height = "";
									var imageRatio = node.width / node.height;
									isNaN(imageRatio) && (imageRatio = node.width === 0 ? 1 : Infinity);
									this._imageRatio = imageRatio;
									this._triggerLayout();
									this.onload && this.onload();
								}),
								on(node, "error", onerror),
								on(node, "abort", onerror)
							];
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
			var m = is(src, "String") && src.match(/^(.+)\:\/\//);
			m && ~Filesystem.protocols.indexOf(m[1]) && (src = Filesystem.getFile(src));
			switch (src && src.declaredClass) {
				case "Ti.Filesystem.File":
					src = src.read();
				case "Ti.Blob":
					src = src.toString();
			}
			return new InternalImageView({
				onload: onload,
				onerror: onerror,
				src: src
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
				this._setState(0, 1);
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
			var c = this.__values__.constants;
			c.paused = !!paused;
			c.animating = !!animating;
		},

		constants: {
			animating: false,
			paused: false
		},

		properties: {
			duration: {
				set: function(value) {
					return Math.max(30, value);
				},
				value: 200
			},

			image: {
				set: function(value) {
					this._removeAllChildren();
					this._images = void 0;
					var self = this; //Need to get event context
					this._add(this._createImage(value, function() {
						self.fireEvent("load", {
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
					if (is(value, "Array")) {
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
							this._add(img);
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