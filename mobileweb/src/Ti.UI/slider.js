Ti._5.createClass('Titanium.UI.Slider', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'input', args, 'Slider');
	this.dom.type = 'range'; 
	Ti._5.Clickable(this);
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.member(this, 'disabledLeftTrackImage');

	Ti._5.member(this, 'disabledRightTrackImage');

	Ti._5.member(this, 'disabledThumbImage');

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
		}
	});
	
	Ti._5.prop(obj, 'backgroundDisabledImage', {
		get: function() {
			return _backgroundDisabledImage ? _backgroundDisabledImage : '';
		},
		set: function(val) {
			_backgroundDisabledImage = val;
		}
	});
	
	Ti._5.prop(obj, 'backgroundDisabledColor', {
		get: function() {
			return _backgroundDisabledColor ? _backgroundDisabledColor : '';
		},
		set: function(val) {
			_backgroundDisabledColor = val;
		}
	});

	Ti._5.member(this, 'highlightedLeftTrackImage');

	Ti._5.member(this, 'highlightedRightTrackImage');

	Ti._5.member(this, 'highlightedThumbImage');

	Ti._5.member(this, 'leftTrackImage');

	var _max = null;
	Ti._5.prop(this, 'max', {
		get: function(){return obj.dom.max;},
		set: function(val){return obj.dom.max = parseFloat(val);}
	});

	Ti._5.member(this, 'maxRange');

	var _min = null;
	Ti._5.prop(this, 'min', {
		get: function(){return obj.dom.min;},
		set: function(val){return obj.dom.min = parseFloat(val);}
	});

	Ti._5.member(this, 'minRange');

	Ti._5.member(this, 'rightTrackImage');

	Ti._5.member(this, 'selectedLeftTrackImage');

	Ti._5.member(this, 'selectedRightTrackImage');

	Ti._5.member(this, 'selectedThumbImage');

	Ti._5.member(this, 'thumbImage');

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
			if (val.width) {
				obj.width = val.width;
			}
			if (val.height) {
				obj.height = val.height;
			}
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