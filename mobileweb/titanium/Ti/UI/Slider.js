define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, Widget, dom, css, style, lang) {

	var setStyle = style.set,
		unitize = dom.unitize,
		thumbWidth = 30;

	return declare("Ti.UI.Slider", Widget, {

		constructor: function(args) {
			this._track = dom.create("div", {
				className: "TiUISliderTrack",
				style: {
					left: 0,
					right: 0,
					top: "10px",
					bottom: "10px",
					position: "absolute",
					backgroundColor: "red"
				}
			}, this.domNode);
			
			this._thumbAligner = dom.create("div", {
				className: "TiUISliderThumbAligner",
				style: {
					left: 0,
					top: 0,
					right: unitize(thumbWidth),
					bottom: 0,
					position: "absolute"
				}
			}, this.domNode);
			this._thumb = dom.create("div", {
				className: "TiUISliderThumb",
				style: {
					left: 0,
					top: 0,
					bottom: 0,
					width: unitize(thumbWidth),
					position: "absolute",
					backgroundColor: "green"
				}
			}, this._thumbAligner);
			
			var initialPosition,
				initialValue,
				self = this;
			this.addEventListener("touchstart", function(e) {
				initialPosition = e.x;
				initialValue = self.value;
			});
			this.addEventListener("touchmove", function(e) {
				self.value = (e.x - initialPosition) * (self.max - self.min) / (self.domNode.clientWidth - thumbWidth) + initialValue;
			});
		},
		
		_doLayout: function() {
			Widget.prototype._doLayout.apply(this,arguments);
			this._updateSize();
		},
		
		_updateSize: function() {
			setStyle(this._thumb, "transform", "translateX(" + Math.round(this._thumbAligner.clientWidth * this.value / (this.max - this.min)) + "px)");
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
			
			value: {
				set: function(value, oldValue) {
					value = this._constrainValue(value);
					if (value !== oldValue) {
						this.fireEvent("change", {
							value: value,
							x: -1,
							y: -1
						});
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 0
			},
		}

	});

});
