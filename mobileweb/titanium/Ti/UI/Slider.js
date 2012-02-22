define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, Widget, dom, css, style, lang) {

	var setStyle = style.set,
		unitize = dom.unitize;

	return declare("Ti.UI.Slider", Widget, {

		constructor: function(args) {
			this._track = dom.create("div", {
				className: "TiUISliderTrack"
			}, this.domNode);
			
			this._thumb = dom.create("div", {
				className: "TiUIButtonDefault TiUISliderThumb"
			}, this.domNode);
			
			var initialPosition,
				initialValue,
				self = this;
			this.addEventListener("touchstart", function(e) {
				initialPosition = e.x;
				initialValue = self.value;
			});
			this.addEventListener("touchmove", function(e) {
				self.value = (e.x - initialPosition) * (self.max - self.min) / (self.domNode.clientWidth - 30) + initialValue;
			});
		},
		
		_doLayout: function() {
			Widget.prototype._doLayout.apply(this,arguments);
			this._updateSize();
		},
		
		_updateSize: function() {
			this._thumbLocation = Math.round((this.domNode.clientWidth - 30) * this.value / (this.max - this.min))
			setStyle(this._thumb, "transform", "translateX(" + this._thumbLocation + "px)");
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
			// There is nothing to measure, or that has a "size" to return, so we just return sensible defaults.
			return {
				width: 200,
				height: 40
			}
		},
		
		_setTouchEnabled: function(value) {
			Widget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this._track, "pointerEvents", cssVal);
			setStyle(this._thumb, "pointerEvents", cssVal);
		},

		properties: {
						
			enabled: {
				set: function(value, oldValue) {
					
					if (value !== oldValue) {
						if (!value) {
							css.remove(this._thumb,"TiUIButtonDefault");
							setStyle(this._thumb,"backgroundColor","#aaa");
						} else {
							css.add(this._thumb,"TiUIButtonDefault");
							setStyle(this._thumb,"backgroundColor","");
						}
						this._setTouchEnabled(value);
					}
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
