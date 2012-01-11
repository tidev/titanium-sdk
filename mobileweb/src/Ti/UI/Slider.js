define("Ti/UI/Slider", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

    var set = style.set,
        undef;

	return declare("Ti.UI.Slider", Widget, {

		constructor: function(args) {
			this.slider = dom.create("input", {
				className: css.clean("TiUISliderSlider")
			});
			this.slider.type = "range";
			this.domNode.appendChild(this.slider);
			set(this.slider,"width","100%");
			set(this.slider,"height","100%");
			this.slider.min = 0;
			this.slider.max = 100;
			this.slider.value = 0;
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "auto",
		_getContentWidth: function() {
			return this.slider.clientWidth;
		},
		_getContentHeight: function() {
			return this.slider.clientHeight;
		},
		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this,arguments);
			this.slider && set(this.slider,"pointerEvents", value ? "auto" : "none");
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
				get: function(value) {
					return this.slider.max;
				},
				set: function(value) {
					this.slider.max = value;
					return value;
				}
			},
			
			min: {
				get: function(value) {
					return this.slider.min;
				},
				set: function(value) {
					this.slider.min = value;
					return value;
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
				get: function(value) {
					return this.slider.value;
				},
				set: function(value) {
					this.slider.value = value;
					return value;
				}
			}
		}

	});

});
