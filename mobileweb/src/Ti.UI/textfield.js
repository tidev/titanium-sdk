Ti._5.createClass("Titanium.UI.TextField", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var undef,
		obj = this,
		domNode = Ti._5.DOMView(obj, "input", args, "TextField"),
		domStyle = domNode.style,
		on = require.on,
		_autocapitalization = 0,
		_autocapitalizationLoaded = false,
		_backgroundImage = "",
		_backgroundColor = "",
		_borderStyle = Titanium.UI.INPUT_BORDERSTYLE_LINE,
		_clearOnEdit = null,
		_clearOnEditLoaded = false,
		_paddingLeft = null,
		_paddingRight = null,
		_suppressReturn = null,
		_suppressLoaded = false,
		_vertAlign = "auto";

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Interactable(obj);
	Ti._5.Touchable(obj, args, true);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	Ti._5.prop(obj, {
		"autocapitalization": {
			get: function() {return _autocapitalization;},
			set: function(val) {
				_autocapitalization = val;
				if (!_autocapitalizationLoaded) {
					on(domNode, "keyup", function() {
						Titanium.UI._updateText(obj);
					});
				}
				obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
			}
		},
		"backgroundDisabledColor": "",
		"backgroundDisabledImage": "",
		"borderStyle": {
			get: function() {
				return _borderStyle ? _borderStyle : "";
			},
			set: function(val) {
				switch(_borderStyle = val){
					case Titanium.UI.INPUT_BORDERSTYLE_NONE:
						domStyle.borderStyle = "none";
						break;
					case Titanium.UI.INPUT_BORDERSTYLE_LINE:
						domStyle.borderStyle = "solid";
						break;
					case Titanium.UI.INPUT_BORDERSTYLE_ROUNDED:
						domStyle.borderStyle = "rounded";
						domStyle.borderRadius = domStyle.borderRadius ? domStyle.borderRadius : domStyle.borderWidth;
						break;
					case Titanium.UI.INPUT_BORDERSTYLE_BEZEL:
						domStyle.borderStyle = "solid";
						break;
				}
			}
		},
		"clearButtonMode": undef,
		"clearOnEdit": {
			get: function(){return _clearOnEdit;},
			set: function(val) {
				_clearOnEdit = val;
				_clearOnEditLoaded || on(domNode, "focus", function() {
					_clearOnEdit && (obj.value = "");
				});
			}
		},
		"editable": {
			get: function() { return obj.enabled; },
			set: function(val) {domNode.disabled = !val ? "disabled" : "";}
		},
		"enabled": {
			get: function(){return !domNode.disabled;},
			set: function(val) {
				_backgroundImage || (_backgroundImage = obj.backgroundImage);
				_backgroundColor || (_backgroundColor = obj.backgroundColor);
				if (val) {
					domNode.disabled = "";
					obj.backgroundImage = _backgroundImage;
					obj.backgroundColor = _backgroundColor;
				} else {
					domNode.disabled = "disabled";
					obj.backgroundDisabledImage && (obj.backgroundImage = obj.backgroundDisabledImage);
					obj.backgroundDisabledColor && (obj.backgroundColor = obj.backgroundDisabledColor);
				}
			}
		},
		"hintText": {
			get: function() {return domNode.placeholder;},
			set: function(val) {
				domNode.placeholder = val;
			}
		},
		"keyboardToolbar": undef,
		"keyboardToolbarColor": undef,
		"keyboardToolbarHeight": undef,
		"leftButton": undef,
		"leftButtonMode": undef,
		"leftButtonPadding": undef,
		"minimumFontSize": undef,
		"paddingLeft": {
			get: function() {return parseInt(domStyle.paddingLeft);},
			set: function(val) {domStyle.paddingLeft = parseInt(val)+"px";}
		},
		"paddingRight": {
			get: function() {return parseInt(domStyle.paddingRight);},
			set: function(val) {domStyle.paddingRight = parseInt(val)+"px";}
		},
		"rightButton": undef,
		"rightButtonMode": undef,
		"rightButtonPadding": undef,
		"size": {
			get: function() {
				return {
					width	: obj.width,
					height	: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		"suppressReturn": {
			get: function() {return _suppressReturn;},
			set: function(val) {
				_suppressReturn = val;
				if (!_suppressLoaded) {
					_suppressLoaded = true;
					on(domNode, "keyup", function(evt) {
						if (_suppressReturn && evt.keyCode == 13) {
							evt.preventDefault && evt.preventDefault();
							return false;
						}
						return true;
					});
				}
			}
		},
		"value": {
			get: function() {return domNode.value;},
			set: function(val) {
				domNode.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : "";
			}
		},
		"verticalAlign": {
			get: function(){return _vertAlign;},
			set: function(val){
				if (parseInt(val) == val) {
					domStyle.lineHeight = val + "px";
				} else {
					switch (val) {
						case "top":
							_vertAlign = "top";
							domStyle.lineHeight = "auto";
							break;
						case "bottom":
							_vertAlign = "bottom";
							domStyle.lineHeight = (obj.height + ((obj.height  - obj.fontSize) * 0.5)) + "px";
							break;
						default:
							_vertAlign = val || "auto";
							domStyle.lineHeight = "auto";
					}
				}
			}
		}
	});

	require.mix(obj, args);

	// Methods
	obj.focus = function(ev) {
		domNode.focus(ev);
	}
	obj.blur = function(ev) {
		domNode.blur(ev);
	}
	obj.hasText = function() {
		return !!obj.value;
	}
});
