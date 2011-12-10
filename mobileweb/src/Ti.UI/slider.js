Ti._5.createClass('Titanium.UI.Slider', function(args){
	var obj = this;
	
	// Set defaults
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	args.width = args.width || '100%';
		
	// Interfaces
	Ti._5.DOMView(this, 'input', args, 'Slider');
	this.dom.type = 'range'; 
	Ti._5.Clickable(this);
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'disabledLeftTrackImage');

	Ti._5.prop(this, 'disabledRightTrackImage');

	Ti._5.prop(this, 'disabledThumbImage');

	var _backgroundDisabledImage = '', _backgroundImage = ''; 
	var	_backgroundDisabledColor = '', _backgroundColor = '';
	Ti._5.prop(this, 'enabled', {
		get: function(){return !obj.dom.disabled;},
		set: function(val) {
			if (!_backgroundImage && obj.backgroundImage) {
				_backgroundImage = obj.backgroundImage;
			}
			if (!_backgroundColor && obj.backgroundColor) {
				_backgroundColor = obj.backgroundColor;
			}
			if (!val) {
				obj.dom.disabled = 'disabled';
				if (_backgroundDisabledImage) {
					obj.backgroundImage = _backgroundDisabledImage;
				}
				if (_backgroundDisabledColor) {
					obj.backgroundColor = _backgroundDisabledColor;
				}
			} else {
				obj.dom.disabled = '';
				obj.backgroundImage = _backgroundImage;
				obj.backgroundColor = _backgroundColor;
			}
			return obj.dom.disabled;
		}
	});
	
	Ti._5.prop(obj, 'backgroundDisabledImage', {
		get: function() {
			return _backgroundDisabledImage ? _backgroundDisabledImage : '';
		},
		set: function(val) {
			return _backgroundDisabledImage = val;
		}
	});
	
	Ti._5.prop(obj, 'backgroundDisabledColor', {
		get: function() {
			return _backgroundDisabledColor ? _backgroundDisabledColor : '';
		},
		set: function(val) {
			return _backgroundDisabledColor = val;
		}
	});

	Ti._5.prop(this, 'highlightedLeftTrackImage');

	Ti._5.prop(this, 'highlightedRightTrackImage');

	Ti._5.prop(this, 'highlightedThumbImage');

	Ti._5.prop(this, 'leftTrackImage');

	var _max = null;
	Ti._5.prop(this, 'max', {
		get: function(){return obj.dom.max;},
		set: function(val){return obj.dom.max = parseFloat(val);}
	});

	Ti._5.prop(this, 'maxRange');

	var _min = null;
	Ti._5.prop(this, 'min', {
		get: function(){return obj.dom.min;},
		set: function(val){return obj.dom.min = parseFloat(val);}
	});

	Ti._5.prop(this, 'minRange');

	Ti._5.prop(this, 'rightTrackImage');

	Ti._5.prop(this, 'selectedLeftTrackImage');

	Ti._5.prop(this, 'selectedRightTrackImage');

	Ti._5.prop(this, 'selectedThumbImage');

	Ti._5.prop(this, 'thumbImage');

	var _value = '';
	Ti._5.prop(this, 'value', {
		get: function(){return _value;},
		set: function(val){
			_value = val;
			obj.dom.value = Ti._5._changeTextToHTML(val);
			var oEvent = {
				source		: obj,
				thumbOffset	: null,
				thumbSize	: null,
				type		: 'change',
				value		: obj.value
			};
			obj.fireEvent('change', oEvent);
			return _value;
		}
	});
	
	Ti._5.prop(this, 'size', {
		get: function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		set: function(val) {
			val.width && (obj.width = Ti._5.px(val.width));
			val.height && (obj.height = Ti._5.px(val.height));
			return val;
		}
	});
	
	require.mix(this, args);


	// Events
	this.dom.addEventListener('change', function(event) {
		var oEvent = {
			source		: obj,
			thumbOffset	: null,
			thumbSize	: null,
			type		: event.type,
			value		: obj.value
		};
		obj.fireEvent('change', oEvent);
	}, false);
	
});