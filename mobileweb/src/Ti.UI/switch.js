Ti._5.createClass('Titanium.UI.Switch', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'Switch');
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	var _checkBox = document.createElement('input');
	_checkBox.type =  'checkbox';
	obj.dom.appendChild(_checkBox);
	var _titleContainer = document.createTextNode("");
	obj.dom.appendChild(_titleContainer);

	// Properties
	var _touchEnabled = true;
	Object.defineProperty(this, 'touchEnabled', {
		get: function() {
			return _touchEnabled ? _touchEnabled : '';
		},
		set: function(val) {
			_touchEnabled = val;
			if (!_touchEnabled) {
				_checkBox.disabled = 'disabled';
			} else {
				obj.enabled = _enabled;
			}
		}
	});
	
	var _enabled = true;
	var _backgroundDisabledImage = '', _backgroundImage = ''; 
	var	_backgroundDisabledColor = '', _backgroundColor = '';
	Object.defineProperty(this, 'enabled', {
		get: function(){return !_checkBox.disabled;},
		set: function(val) {
			_enabled = val ? true : false;
			if (!_backgroundImage && obj.backgroundImage) {
				_backgroundImage = obj.backgroundImage;
			}
			if (!_backgroundColor && obj.backgroundColor) {
				_backgroundColor = obj.backgroundColor;
			}
			if (!val || !_touchEnabled) {
				_checkBox.disabled = 'disabled';
				if (_backgroundDisabledImage) {
					obj.backgroundImage = _backgroundDisabledImage;
				}
				if (_backgroundDisabledColor) {
					obj.backgroundColor = _backgroundDisabledColor;
				}
			} else {
				_checkBox.disabled = '';
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

	var _style = Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON;
	Object.defineProperty(this, 'style', {
		get: function(){return _style;},
		set: function(val){return _style = val;}
	});
	
	var _title = '';
	Object.defineProperty(this, 'title', {
		get: function() {return _title ? _title : obj.dom.innerHTML;},
		set: function(val) {
			if (obj.style == Ti.UI.Android.SWITCH_STYLE_CHECKBOX) {
				_title = val;
				obj.dom.innerHTML = '';
				obj.dom.appendChild(_checkBox);
				obj.dom.appendChild(document.createTextNode(Ti._5._changeTextToHTML(val)));
				obj.render(null);
			}
		}
	});

	var _titleOff = null;
	Object.defineProperty(this, 'titleOff', {
		get: function(){return _titleOff;},
		set: function(val){
			_titleOff = val;
			if (!obj.dom.checked && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
				obj.title = _titleOff;
			}
		}
	});

	var _titleOn = null;
	Object.defineProperty(this, 'titleOn', {
		get: function(){return _titleOn;},
		set: function(val){
			_titleOn = val; 
			if (obj.dom.checked && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
				obj.title = _titleOn;
			}
		}
	});

	Object.defineProperty(this, 'value', {
		get: function(){return _checkBox.checked;},
		set: function(val){_checkBox.checked = val;_checking(null);}
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
		"touchEnabled", "style", "title", "backgroundDisabledImage", "backgroundDisabledColor", "enabled",
		"size", "value", "titleOff", "titleOn"
	], args);
	Ti._5.presetUserDefinedElements(this, args);

	// Events
	obj.dom.addEventListener('click', function(event) {
		if (_touchEnabled && _checkBox !== event.target) {
			_checkBox.checked = !_checkBox.checked;
			_checking();
		}
	}, false);
	obj.dom.addEventListener('touchstart', function(event) {
		if (_touchEnabled && _checkBox !== event.target && _checkBox.touchstart) {
			_checkBox.checked = !_checkBox.checked;
			_checking();
		}
	}, false);
	// We need this here for firing 'click'/'touchstart' & 'change' events in native order 
	Ti._5.Clickable(this);
	
	function _checking(event) {
		if (_checkBox.checked && _titleOn && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
			obj.title = _titleOn;
		}
		if (!_checkBox.checked && _titleOff && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
			obj.title = _titleOff;
		}
		var oEvent = {
			source		: obj,
			type		: 'change',
			value		: _checkBox.checked
		};
		obj.fireEvent('change', oEvent);
	}
	
	_checkBox.addEventListener('change', _checking, false);
});
