Ti._5.createClass("Ti.UI.Slider", function(args){
	args = require.mix({
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "input", args, "Slider"),
		_backgroundDisabledImage = "",
		_backgroundImage = "", 
		_backgroundDisabledColor = "",
		_backgroundColor = "",
		_max = null,
		_min = null,
		_value = "";
	
	// Interfaces
	domNode.type = "range"; 
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args, true);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		disabledLeftTrackImage: null,
		disabledRightTrackImage: null,
		disabledThumbImage: null,
		enabled: {
			get: function(){return !domNode.disabled;},
			set: function(val) {
				if (!_backgroundImage && obj.backgroundImage) {
					_backgroundImage = obj.backgroundImage;
				}
				if (!_backgroundColor && obj.backgroundColor) {
					_backgroundColor = obj.backgroundColor;
				}
				if (!val) {
					domNode.disabled = "disabled";
					if (_backgroundDisabledImage) {
						obj.backgroundImage = _backgroundDisabledImage;
					}
					if (_backgroundDisabledColor) {
						obj.backgroundColor = _backgroundDisabledColor;
					}
				} else {
					domNode.disabled = "";
					obj.backgroundImage = _backgroundImage;
					obj.backgroundColor = _backgroundColor;
				}
			}
		},
		backgroundDisabledImage: {
			get: function() {
				return _backgroundDisabledImage ? _backgroundDisabledImage : "";
			},
			set: function(val) {
				_backgroundDisabledImage = val;
			}
		},
		backgroundDisabledColor: {
			get: function() {
				return _backgroundDisabledColor ? _backgroundDisabledColor : "";
			},
			set: function(val) {
				_backgroundDisabledColor = val;
			}
		},
		highlightedLeftTrackImage: null,
		highlightedRightTrackImage: null,
		highlightedThumbImage: null,
		leftTrackImage: null,
		max: {
			get: function(){return domNode.max;},
			set: function(val){domNode.max = parseFloat(val);}
		},
		maxRange: null,
		min: {
			get: function(){return domNode.min;},
			set: function(val){domNode.min = parseFloat(val);}
		},
		minRange: null,
		rightTrackImage: null,
		selectedLeftTrackImage: null,
		selectedRightTrackImage: null,
		selectedThumbImage: null,
		thumbImage: null,
		value: {
			get: function(){return _value;},
			set: function(val){
				_value = val;
				domNode.value = Ti._5._changeTextToHTML(val);
				obj.fireEvent("change", {
					thumbOffset	: null,
					thumbSize	: null,
					value		: val
				});
			}
		},
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = require("Ti/_/dom").unitize(val.width));
				val.height && (obj.height = require("Ti/_/dom").unitize(val.height));
			}
		}
	});

	require.mix(obj, args);

	// Events
	require.on(domNode, "change", function() {
		obj.fireEvent("change", {
			thumbOffset	: null,
			thumbSize	: null,
			value		: obj.value
		});
	});
	
});