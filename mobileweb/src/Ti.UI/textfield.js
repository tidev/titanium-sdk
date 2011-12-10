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
	Ti._5.prop(this, 'autocapitalization', {
		get: function() {return _autocapitalization;},
		set: function(val) {
			_autocapitalization = val;
			if (!_autocapitalizationLoaded) {
				obj.dom.addEventListener('keyup', function(event) {
					Titanium.UI._updateText(obj);
				}, false);
			}
			return obj.value = Titanium.UI._capitalizeValue(_autocapitalization, obj.value);
		}
	});
	
	Ti._5.prop(this, 'value', {
		get: function() {return obj.dom.value;},
		set: function(val) {
			return obj.dom.value = val ? Titanium.UI._capitalizeValue(_autocapitalization, val) : '';
		}
	});
	
	Ti._5.prop(this, 'editable', {
		get: function() { return obj.enabled; },
		set: function(val) {return obj.dom.disabled = !val ? 'disabled' : '';}
	});

	var _backgroundImage = '',
		_backgroundColor = '';
	Ti._5.prop(this, 'enabled', {
		get: function(){return !obj.dom.disabled;},
		set: function(val) {
			_backgroundImage || (_backgroundImage = obj.backgroundImage);
			_backgroundColor || (_backgroundColor = obj.backgroundColor);
			if (val) {
				obj.dom.disabled = '';
				obj.backgroundImage = _backgroundImage;
				obj.backgroundColor = _backgroundColor;
			} else {
				obj.dom.disabled = 'disabled';
				obj.backgroundDisabledImage && (obj.backgroundImage = obj.backgroundDisabledImage);
				obj.backgroundDisabledColor && (obj.backgroundColor = obj.backgroundDisabledColor);
			}
			return val;
		}
	});
	
	var _borderStyle = Titanium.UI.INPUT_BORDERSTYLE_LINE;
	Ti._5.prop(obj, 'borderStyle', {
		get: function() {
			return _borderStyle ? _borderStyle : '';
		},
		set: function(val) {
			switch(_borderStyle = val){
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
			return _borderStyle;
		}
	});

	Ti._5.prop(obj, 'backgroundDisabledImage', '');

	Ti._5.prop(obj, 'backgroundDisabledColor', '');
	
	Ti._5.prop(this, 'clearButtonMode');

	var _clearOnEdit = null, _clearOnEditLoaded = false;
	Ti._5.prop(this, 'clearOnEdit', {
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
			return _clearOnEdit;
		}
	});

	Ti._5.prop(this, 'hintText', {
		get: function() {return obj.dom.placeholder;},
		set: function(val) {
			return obj.dom.placeholder = val;
		}
	});
	
	Ti._5.prop(this, 'keyboardToolbar');
	
	Ti._5.prop(this, 'keyboardToolbarColor');

	Ti._5.prop(this, 'keyboardToolbarHeight');
	
	// iPhone spes
	Ti._5.prop(this, 'leftButton');
	
	// iPhone spes
	Ti._5.prop(this, 'leftButtonMode');

	// iPhone spes
	Ti._5.prop(this, 'leftButtonPadding');

	Ti._5.prop(this, 'minimumFontSize');

	var _paddingLeft = null;
	Ti._5.prop(this, 'paddingLeft', {
		get: function() {return parseInt(obj.dom.style.paddingLeft);},
		set: function(val) {return obj.dom.style.paddingLeft = parseInt(val)+"px";}
	});

	var _paddingRight = null;
	Ti._5.prop(this, 'paddingRight', {
		get: function() {return parseInt(obj.dom.style.paddingRight);},
		set: function(val) {return obj.dom.style.paddingRight = parseInt(val)+"px";}
	});
	
	// iPhone spes
	Ti._5.prop(this, 'rightButton');
	
	// iPhone spes
	Ti._5.prop(this, 'rightButtonMode');

	// iPhone spes
	Ti._5.prop(this, 'rightButtonPadding');

	var _suppressReturn = null, _suppressLoaded = false;
	Ti._5.prop(this, 'suppressReturn', {
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
			return _suppressLoaded;
		}
	});

	var _vertAlign = 'auto';
	Ti._5.prop(this, 'verticalAlign', {
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
					default:
						_vertAlign = val || "auto";
						obj.dom.style.lineHeight = 'auto';
				}
			}
			return val;
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

	// Methods
	obj.focus = function(ev) {
		obj.dom.focus(ev);
	}
	obj.blur = function(ev) {
		obj.dom.blur(ev);
	}
	obj.hasText = function() {
		return !!obj.value;
	}
});
