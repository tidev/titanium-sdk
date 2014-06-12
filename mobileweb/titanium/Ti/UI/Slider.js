/*global define*/
define(['Ti/_/declare', 'Ti/_/UI/Widget', 'Ti/_/dom', 'Ti/_/css', 'Ti/_/style', 'Ti/_/lang', 'Ti/UI'],
	function(declare, Widget, dom, css, style, lang, UI) {

	var on = require.on,
		setStyle = style.set;

	return declare('Ti.UI.Slider', Widget, {

		constructor: function() {
			var self = this,
				initialPosition,
				initialValue,
				track = self._track = dom.create('div', {
					className: 'TiUISliderTrack'
				}, self.domNode),
				thumb = self._thumb = dom.create('div', {
					className: 'TiUIElementGradient TiUISliderThumb'
				}, self.domNode);

			on(self, 'touchstart', function(e) {
				initialPosition = e.x;
				initialValue = self.value;
			});

			on(self, 'touchmove', function(e) {
				self.value = (e.x - initialPosition) * (self.max - self.min) / (track.offsetWidth - thumb.offsetWidth) + initialValue;
			});

			on(self, 'postlayout', self, '_updatePosition');
		},

		_constrainedUpdate: function(value) {
			this.__values__.properties.value = this._constrainValue(value);
			this._updatePosition();
		},

		_constrainValue: function(value) {
			return Math.min(lang.val(this.maxRange, this.max), Math.max(lang.val(this.minRange, this.min), value));
		},

		_updatePosition: function() {
			var thumb = this._thumb;
			this._thumbLocation = Math.round((this._track.offsetWidth - thumb.offsetWidth) *
				((this.value - this.min) / (this.max - this.min)));
			setStyle(thumb, 'transform', 'translateX(' + this._thumbLocation + 'px)');
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.SIZE,

		_setTouchEnabled: function(value) {
			var cssVal = value ? 'auto' : 'none';
			Widget.prototype._setTouchEnabled.call(this, value);
			setStyle(this._track, 'pointerEvents', cssVal);
			setStyle(this._thumb, 'pointerEvents', cssVal);
		},

		_getContentSize: function() {
			return {
				width: 200,
				height: 40
			};
		},

		properties: {

			enabled: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						css.remove(this._thumb, ['TiUIElementGradient', 'TiUISliderThumbDisabled']);
						css.add(this._thumb, value ? 'TiUIElementGradient' : 'TiUISliderThumbDisabled');
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},

			max: {
				set: function(value) {
					return Math.max(this.min, value);
				},
				post: '_constrainedUpdate',
				value: 1
			},

			maxRange: {
				set: function(value) {
					return Math.min(this.max, value);
				},
				post: '_constrainedUpdate'
			},

			min: {
				set: function(value) {
					return Math.min(this.max, value);
				},
				post: '_constrainedUpdate',
				value: 0
			},

			minRange: {
				set: function(value) {
					return Math.max(this.min, value);
				},
				post: '_constrainedUpdate'
			},

			value: {
				set: function(value) {
					return this._constrainValue(value);
				},
				post: function(value, oldValue) {
					if (value !== oldValue) {
						this.fireEvent('change', {
							value: value,
							thumbOffset: {
								x: 0,
								y: 0
							},
							thumbSize: {
								height: 0,
								width: 0
							}
						});
					}
					this._updatePosition();
				},
				value: 0
			}

		}

	});

});
