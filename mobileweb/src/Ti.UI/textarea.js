Ti._5.createClass('Titanium.UI.TextArea', function(args){
	var obj = this;
	
	args = Ti._5.extend({}, args);
	args.unselectable = true;
		
	// Interfaces
	Ti._5.DOMView(this, 'textarea', args, 'TextArea');
	Ti._5.Clickable(this);
	Ti._5.Interactable(this);
	Ti._5.Touchable(this, args, true);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);
	this.dom.style.resize = 'none';

	// Properties
	var _autoLink = null, _autoLinkLoaded = false;
	Ti._5.prop(this, 'autoLink', {
		get: function() {return _autoLink;},
		set: function(val) { _autoLink = val; }
	});

	// Improve change event for textarea
	obj.dom.addEventListener('keyup', function(event) {
		var oEvent = {
			source		: event.target,
			type		: event.type
		};
		if (obj.dom && 'undefined' != typeof obj.dom.value) {
			oEvent.value = obj.dom.value;
		}
		obj.fireEvent('change', oEvent);
	}, false);
	
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
			if (!_backgroundImage && obj.backgroundImage) {
				_backgroundImage = obj.backgroundImage;
			}
			if (!_backgroundColor && obj.backgroundColor) {
				_backgroundColor = obj.backgroundColor;
			}
			if (!val) {
				obj.dom.disabled = 'disabled';
				obj.backgroundDisabledImage && (obj.backgroundImage = obj.backgroundDisabledImage);
				obj.backgroundDisabledColor && (obj.backgroundColor = obj.backgroundDisabledColor);
			} else {
				obj.dom.disabled = '';
				obj.backgroundImage = _backgroundImage;
				obj.backgroundColor = _backgroundColor;
			}
			return val;
		}
	});
	
	Ti._5.prop(obj, 'backgroundDisabledImage', '');
	
	Ti._5.prop(obj, 'backgroundDisabledColor', '');
	
	Ti._5.prop(this, 'keyboardToolbar');
	
	Ti._5.prop(this, 'keyboardToolbarColor');

	Ti._5.prop(this, 'keyboardToolbarHeight');

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
			return _suppressReturn;
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
	this.blur = function(){
		obj.dom.blur();
	};
	this.focus = function(){
		obj.dom.focus();
	};
	this.hasText = function(){
		return obj.value ? true : false;
	};
	
	function _check_sel(event, isMouse) {
		var startPos = obj.dom.selectionStart;
		var endPos = obj.dom.selectionEnd;
		if (obj.value.substring(startPos,endPos).length != 0 && (!event.shiftKey || isMouse)){
			var oEvent = {
				range		: {
					location	: startPos,
					length		: obj.value.substring(startPos,endPos).length
				},
				source		: obj,
				type		: 'selected'
			};
			obj.fireEvent('selected', oEvent);
			return true;
		}
		return false;
	}
	
	var _isIOS = false;
	if (
		-1 < Titanium.Platform.osname.indexOf('iphone') ||
		-1 < Titanium.Platform.osname.indexOf('ipod') ||
		-1 < Titanium.Platform.osname.indexOf('ipad') 
	) {
		_isIOS = true;
	}
	
	var _timeoutId  = null;
	function _iOSFix () {
		if (_timeoutId) {
			return;
		}
		_timeoutId = setTimeout(function() {
			_timeoutId = null;
			if (!_check_sel({shiftKey: false}, true)) {
				_iOSFix();
			} 
		}, 500);
	};
	
	obj.dom.addEventListener('keyup', function(event) {
		_check_sel(event, false);
		if (_isIOS) {
			_iOSFix();
		}
	}, false);
	obj.dom.addEventListener('mouseup', function(event) {
		_check_sel(event, true);
		if (_isIOS) {
			_iOSFix();
		}
	}, false);
});
