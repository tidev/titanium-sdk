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
	var _disabledLeftTrackImage = null;
	Object.defineProperty(this, 'disabledLeftTrackImage', {
		get: function(){return _disabledLeftTrackImage;},
		set: function(val){return _disabledLeftTrackImage = val;}
	});

	var _disabledRightTrackImage = null;
	Object.defineProperty(this, 'disabledRightTrackImage', {
		get: function(){return _disabledRightTrackImage;},
		set: function(val){return _disabledRightTrackImage = val;}
	});

	var _disabledThumbImage = null;
	Object.defineProperty(this, 'disabledThumbImage', {
		get: function(){return _disabledThumbImage;},
		set: function(val){return _disabledThumbImage = val;}
	});

	var _backgroundDisabledImage = '', _backgroundImage = ''; 
	var	_backgroundDisabledColor = '', _backgroundColor = '';
	Object.defineProperty(this, 'enabled', {
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
	
	Object.defineProperty(obj, 'backgroundDisabledImage', {
		get: function() {
			return _backgroundDisabledImage ? _backgroundDisabledImage : '';
		},
		set: function(val) {
			_backgroundDisabledImage = val;
		}
	});
	
	Object.defineProperty(obj, 'backgroundDisabledColor', {
		get: function() {
			return _backgroundDisabledColor ? _backgroundDisabledColor : '';
		},
		set: function(val) {
			_backgroundDisabledColor = val;
		}
	});

	var _highlightedLeftTrackImage = null;
	Object.defineProperty(this, 'highlightedLeftTrackImage', {
		get: function(){return _highlightedLeftTrackImage;},
		set: function(val){return _highlightedLeftTrackImage = val;}
	});

	var _highlightedRightTrackImage = null;
	Object.defineProperty(this, 'highlightedRightTrackImage', {
		get: function(){return _highlightedRightTrackImage;},
		set: function(val){return _highlightedRightTrackImage = val;}
	});

	var _highlightedThumbImage = null;
	Object.defineProperty(this, 'highlightedThumbImage', {
		get: function(){return _highlightedThumbImage;},
		set: function(val){return _highlightedThumbImage = val;}
	});

	var _leftTrackImage = null;
	Object.defineProperty(this, 'leftTrackImage', {
		get: function(){return _leftTrackImage;},
		set: function(val){return _leftTrackImage = val;}
	});

	var _max = null;
	Object.defineProperty(this, 'max', {
		get: function(){return obj.dom.max;},
		set: function(val){return obj.dom.max = parseFloat(val);}
	});

	var _maxRange = null;
	Object.defineProperty(this, 'maxRange', {
		get: function(){return _maxRange;},
		set: function(val){return _maxRange = val;}
	});

	var _min = null;
	Object.defineProperty(this, 'min', {
		get: function(){return obj.dom.min;},
		set: function(val){return obj.dom.min = parseFloat(val);}
	});

	var _minRange = null;
	Object.defineProperty(this, 'minRange', {
		get: function(){return _minRange;},
		set: function(val){return _minRange = val;}
	});

	var _rightTrackImage = null;
	Object.defineProperty(this, 'rightTrackImage', {
		get: function(){return _rightTrackImage;},
		set: function(val){return _rightTrackImage = val;}
	});

	var _selectedLeftTrackImage = null;
	Object.defineProperty(this, 'selectedLeftTrackImage', {
		get: function(){return _selectedLeftTrackImage;},
		set: function(val){return _selectedLeftTrackImage = val;}
	});

	var _selectedRightTrackImage = null;
	Object.defineProperty(this, 'selectedRightTrackImage', {
		get: function(){return _selectedRightTrackImage;},
		set: function(val){return _selectedRightTrackImage = val;}
	});

	var _selectedThumbImage = null;
	Object.defineProperty(this, 'selectedThumbImage', {
		get: function(){return _selectedThumbImage;},
		set: function(val){return _selectedThumbImage = val;}
	});

	var _thumbImage = null;
	Object.defineProperty(this, 'thumbImage', {
		get: function(){return _thumbImage;},
		set: function(val){return _thumbImage = val;}
	});

	var _value = '';
	Object.defineProperty(this, 'value', {
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
	
	Object.defineProperty(this, 'size', {
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
	
	Ti._5.preset(this, [
		"enabled", "backgroundDisabledImage", "backgroundDisabledColor",
		"max", "min", "value", "size"
	], args);
	Ti._5.presetUserDefinedElements(this, args);


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