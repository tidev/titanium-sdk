Ti._5.createClass('Titanium.UI.TextField', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
	
	// Interfaces
	Ti._5.DOMView(this, 'input', args, 'TextField');
	Ti._5.Clickable(this);
	Ti._5.Interactable(this);
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	
	// Properties
	var _autocapitalization = 0;
	var _autocapitalizationLoaded = false;
	Object.defineProperty(this, 'autocapitalization', {
		get: function() {return _autocapitalization;},
		set: function(val) {
			_autocapitalization = val;
			if (!_autocapitalizationLoaded) {
				obj.dom.addEventListener('keyup', function(event) {
					Titanium.UI._updateText(obj);
				}, false);
			}
			obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
		}
	});
	
	Object.defineProperty(this, 'value', {
		get: function() {return obj.dom.value;},
		set: function(val) {
			obj.dom.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : '';
		}
	});
	
	Object.defineProperty(this, 'editable', {
		get: function() { return obj.enabled; },
		set: function(val) {obj.dom.disabled = !val ? 'disabled' : '';}
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
	
	var _borderStyle = Titanium.UI.INPUT_BORDERSTYLE_LINE;
	Object.defineProperty(obj, 'borderStyle', {
		get: function() {
			return _backgroundDisabledImage ? _backgroundDisabledImage : '';
		},
		set: function(val) {
			_borderStyle = val;
			switch(val){
				case Titanium.UI.INPUT_BORDERSTYLE_NONE:
					obj.dom.style.borderStyle = "none";
					break;
				case Titanium.UI.INPUT_BORDERSTYLE_LINE:
					obj.dom.style.borderStyle = "solid";
					break;
				case Titanium.UI.INPUT_BORDERSTYLE_ROUNDED:
					obj.dom.style.borderStyle = "rounded";
					obj.dom.style.borderRadius = obj.dom.style.borderRadius ? obj.dom.style.borderRadius : obj.dom.style.borderWidth;
					break;
				case Titanium.UI.INPUT_BORDERSTYLE_BEZEL:
					obj.dom.style.borderStyle = "solid";
					break;
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
	
	var _clearButtonMode = null;
	Object.defineProperty(this, 'clearButtonMode', {
		get: function(){return _clearButtonMode;},
		set: function(val){return _clearButtonMode = val;}
	});

	var _clearOnEdit = null, _clearOnEditLoaded = false;
	Object.defineProperty(this, 'clearOnEdit', {
		get: function(){return _clearOnEdit;},
		set: function(val) {
			_clearOnEdit = val;
			if (!_clearOnEditLoaded) {
				obj.dom.addEventListener('focus', function() {
					if (_clearOnEdit) {
						obj.value = '';
					}
				}, false);
			}
		}
	});

	Object.defineProperty(this, 'hintText', {
		get: function() {return obj.dom.placeholder;},
		set: function(val) {
			obj.dom.placeholder = val;
		}
	});
	
	var _keyboardToolbar = null;
	Object.defineProperty(this, 'keyboardToolbar', {
		get: function(){return _keyboardToolbar;},
		set: function(val){return _keyboardToolbar = val;}
	});
	
	var _keyboardToolbarColor = null;
	Object.defineProperty(this, 'keyboardToolbarColor', {
		get: function(){return _keyboardToolbarColor;},
		set: function(val){return _keyboardToolbarColor = val;}
	});

	var _keyboardToolbarHeight = null;
	Object.defineProperty(this, 'keyboardToolbarHeight', {
		get: function(){return _keyboardToolbarHeight;},
		set: function(val){return _keyboardToolbarHeight = val;}
	});
	
	// iPhone spes
	var _leftButton = null;
	Object.defineProperty(this, 'leftButton', {
		get: function(){return _leftButton;},
		set: function(val){return _leftButton = val;}
	});
	
	// iPhone spes
	var _leftButtonMode = null;
	Object.defineProperty(this, 'leftButtonMode', {
		get: function(){return _leftButtonMode;},
		set: function(val){return _leftButtonMode = val;}
	});

	// iPhone spes
	var _leftButtonPadding = null;
	Object.defineProperty(this, 'leftButtonPadding', {
		get: function(){return _leftButtonPadding;},
		set: function(val){return _leftButtonPadding = val;}
	});

	var _minimumFontSize = null;
	Object.defineProperty(this, 'minimumFontSize', {
		get: function() {return _minimumFontSize;},
		set: function(val) {_minimumFontSize = val;}
	});

	var _paddingLeft = null;
	Object.defineProperty(this, 'paddingLeft', {
		get: function() {return parseInt(obj.dom.style.paddingLeft);},
		set: function(val) {obj.dom.style.paddingLeft = parseInt(val)+"px";}
	});

	var _paddingRight = null;
	Object.defineProperty(this, 'paddingRight', {
		get: function() {return parseInt(obj.dom.style.paddingRight);},
		set: function(val) {obj.dom.style.paddingRight = parseInt(val)+"px";}
	});
	
	// iPhone spes
	var _rightButton = null;
	Object.defineProperty(this, 'rightButton', {
		get: function(){return _rightButton;},
		set: function(val){return _rightButton = val;}
	});
	
	// iPhone spes
	var _rightButtonMode = null;
	Object.defineProperty(this, 'rightButtonMode', {
		get: function(){return _rightButtonMode;},
		set: function(val){return _rightButtonMode = val;}
	});

	// iPhone spes
	var _rightButtonPadding = null;
	Object.defineProperty(this, 'rightButtonPadding', {
		get: function(){return _rightButtonPadding;},
		set: function(val){return _rightButtonPadding = val;}
	});

	var _suppressReturn = null, _suppressLoaded = false;
	Object.defineProperty(this, 'suppressReturn', {
		get: function() {return _suppressReturn;},
		set: function(val) {
			_suppressReturn = val;
			if (!_suppressLoaded) {
				_suppressLoaded = true;
				obj.dom.addEventListener('keyup', function(event) {
					if (_suppressReturn && event.keyCode == 13) {
						if (event.preventDefault) event.preventDefault();
						return false;
					} else {
						return true;
					}
				}, false);
			}
		}
	});

	var _vertAlign = 'auto';
	Object.defineProperty(this, 'verticalAlign', {
		get: function(){return _vertAlign;},
		set: function(val){
			if (parseInt(val) == val) {
				obj.dom.style.lineHeight = val + 'px';
			} else {
				switch (val) {
					case 'top': 
						_vertAlign = 'top';
						obj.dom.style.lineHeight = 'auto';
						break;
					case 'bottom':
						_vertAlign = 'bottom';
						obj.dom.style.lineHeight = (obj.height + ((obj.height  - obj.fontSize) * 0.5)) + 'px';
						break;
					case 'middle':
						_vertAlign = 'middle';
					case 'auto':
					default : 
						_vertAlign = 'auto';
						obj.dom.style.lineHeight = 'auto';
				}
			}
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
				obj.width = Ti._5.parseLength(val.width);
			}
			if (val.height) {
				obj.height = Ti._5.parseLength(val.height);
			}
		}
	});

	Ti._5.preset(this, [
		"value", "autocapitalization", "editable", "clearOnEdit", "suppressReturn",
		"hintText", "paddingLeft", "paddingRight", "borderStyle", "backgroundDisabledImage",
		"backgroundDisabledColor", "verticalAlign", "size", "enabled"
	], args);
	Ti._5.presetUserDefinedElements(this, args);

	// Methods
	obj.focus = function(ev) {
		obj.dom.focus(ev);
	}
	obj.blur = function(ev) {
		obj.dom.blur(ev);
	}
	obj.hasText = function() {
		return obj.value ? true : false;
	}
});
