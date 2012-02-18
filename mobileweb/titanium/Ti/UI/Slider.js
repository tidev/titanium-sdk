define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, Widget, dom, css, style, lang) {

	var setStyle = style.set;

	return declare("Ti.UI.Slider", Widget, {

		constructor: function(args) {
			this._contentContainer = dom.create("div", {
				className: "TiUISliderContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center",
					width: "100%",
					height: "100%"
				}
			}, this.domNode);
			this._leftTrack = dom.create("div", {
				className: "TiUISliderLeftTrack",
				style: {
					height: "5px",
					backgroundColor: "red"
				}
			}, this._contentContainer);
			this._thumb = dom.create("div", {
				className: "TiUISliderThumb",
				style: {
					width: "20px",
					height: "20px",
					backgroundColor: "green"
				}
			}, this._contentContainer);
			this._rightTrack = dom.create("div", {
				className: "TiUISliderRightTrack",
				style: {
					height: "5px",
					backgroundColor: "blue"
				}
			}, this._contentContainer);
			
			var initialPosition,
				initialValue,
				self = this,
				mouseMoveListener = function(e) {
					var value = (e.clientX - initialPosition) * (self.max - self.min) / (self._measuredWidth - 20) + initialValue;
					self.value = Math.min(Math.max(value, self.min), self.max)
				},
				mouseUpListener = function(e) {
					document.body.removeEventListener("mousemove", mouseMoveListener);
					document.body.removeEventListener("mouseup", mouseUpListener);
				};
			this._thumb.addEventListener("mousedown", function(e) {
				initialPosition = e.clientX;
				initialValue = self.value;
				document.body.addEventListener("mousemove", mouseMoveListener);
				document.body.addEventListener("mouseup", mouseUpListener);
			});
		},
		
		_doLayout: function() {
			Widget.prototype._doLayout.apply(this,arguments);
			this._updateSize();
		},
		
		_updateSize: function() {
			var scaleFactor = this._measuredWidth - 20;
			setStyle(this._leftTrack,"width",(this.value / this.max) * scaleFactor + "px");
			setStyle(this._rightTrack,"width",(this.max - this.value) / this.max * scaleFactor + "px");
		},
		
		_constrainValue: function(value) {
			var minVal = lang.val(this.minRange, this.min),
				maxVal = lang.val(this.maxRange, this.max);
			value < minVal && (value = minVal);
			value > maxVal && (value = maxVal);
			return value;
		},
		
		_defaultWidth: "100%",
		
		_defaultHeight: "auto",
		
		_getContentSize: function(width, height) {
			console.debug('Method "Titanium.UI.Slider#._getContentSize" is not implemented yet.');
		},
		
		_setTouchEnabled: function(value) {
			console.debug('Method "Titanium.UI.Slider#._setTouchEnabled" is not implemented yet.');
		},

		properties: {
			disabledLeftTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.disabledLeftTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.disabledLeftTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			disabledRightTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.disabledRightTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.disabledRightTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			disabledThumbImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.disabledThumbImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.disabledThumbImage" is not implemented yet.');
					return value;
				}
			},
			
			enabled: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.enabled" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.enabled" is not implemented yet.');
					return value;
				},
				value: true
			},
			
			highlightedLeftTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.highlightedLeftTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.highlightedLeftTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			highlightedRightTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.highlightedRightTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.highlightedRightTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			highlightedThumbImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.highlightedThumbImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.highlightedThumbImage" is not implemented yet.');
					return value;
				}
			},
			
			leftTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.leftTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.leftTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			max: {
				set: function(value) {
					value < this.min && (value = this.min);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
				},
				value: 100
			},
			
			maxRange: {
				set: function(value) {
					value > this.max && (value = this.max);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
				}
			},
			
			min: {
				set: function(value) {
					value > this.max && (value = this.max);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
				},
				value: 0
			},
			
			minRange: {
				set: function(value) {
					value < this.min && (value = this.min);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
				}
			},
			
			rightTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.rightTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.rightTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			selectedLeftTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.selectedLeftTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.selectedLeftTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			selectedRightTrackImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.selectedRightTrackImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.selectedRightTrackImage" is not implemented yet.');
					return value;
				}
			},
			
			selectedThumbImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.selectedThumbImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.selectedThumbImage" is not implemented yet.');
					return value;
				}
			},
			
			thumbImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Slider#.thumbImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Slider#.thumbImage" is not implemented yet.');
					return value;
				}
			},
			
			value: {
				set: function(value) {
					value = this._constrainValue(value);
					return value;
				},
				post: function() {
					this._updateSize();
					this.fireEvent("change", {
						value: this.value,
						x: -1,
						y: -1
					})
				},
				value: 0
			},
		}

	});

});
