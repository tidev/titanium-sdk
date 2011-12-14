Ti._5.createClass("Ti.UI.TextArea", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var undef,
		obj = this,
		on = require.on,
		domNode = Ti._5.DOMView(obj, "textarea", args, "TextArea"),
		_autoLink = null,
		_autoLinkLoaded = false,
		_autocapitalization = 0,
		_autocapitalizationLoaded = false,
		_backgroundImage = "",
		_backgroundColor = "",
		_suppressReturn = null,
		_suppressLoaded = false,
		isIOS = /(iphone|ipod|ipad)/i.test(Ti.Platform.ostype),
		timeoutId  = null;

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Interactable(obj);
	Ti._5.Touchable(obj, args, true);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	domNode.style.resize = "none";

	// Properties
	Ti._5.prop(obj, {
		autoLink: {
			get: function() {return _autoLink;},
			set: function(val) { _autoLink = val; }
		},
		autocapitalization: {
			get: function() {return _autocapitalization;},
			set: function(val) {
				_autocapitalization = val;
				_autocapitalizationLoaded || on(domNode, "keyup", function() {
					Ti.UI._updateText(obj);
				});
				obj.value = Ti.UI._capitalizeValue(_autocapitalization, obj.value);
			}
		},
		backgroundDisabledImage: undef,
		backgroundDisabledColor: undef,
		editable: {
			get: function() { return obj.enabled; },
			set: function(val) {domNode.disabled = !val ? "disabled" : "";}
		},
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
					obj.backgroundDisabledImage && (obj.backgroundImage = obj.backgroundDisabledImage);
					obj.backgroundDisabledColor && (obj.backgroundColor = obj.backgroundDisabledColor);
				} else {
					domNode.disabled = "";
					obj.backgroundImage = _backgroundImage;
					obj.backgroundColor = _backgroundColor;
				}
			}
		},
		keyboardToolbar: undef,
		keyboardToolbarColor: undef,
		keyboardToolbarHeight: undef,
		size: {
			get: function() {
				return {
					width: obj.width,
					height: obj.height
				}
			},
			set: function(val) {
				val.width && (obj.width = Ti._5.px(val.width));
				val.height && (obj.height = Ti._5.px(val.height));
			}
		},
		suppressReturn: {
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
		value: {
			get: function() {return domNode.value;},
			set: function(val) {
				domNode.value = val ? Ti.UI._capitalizeValue(_autocapitalization, val) : "";
			}
		}
	});

	// Improve change event for textarea
	on(domNode, "keyup", function(evt) {
		obj.fireEvent("change", {
			source: evt.target,
			type: evt.type,
			value: domNode && domNode.value
		});
	});

	require.mix(obj, args);

	// Methods
	obj.blur = function(){
		domNode.blur();
	};
	obj.focus = function(){
		domNode.focus();
	};
	obj.hasText = function(){
		return !!obj.value;
	};
	
	function isSelected(event, isMouse) {
		var startPos = domNode.selectionStart,
			endPos = domNode.selectionEnd;
		if (obj.value.substring(startPos,endPos).length != 0 && (!event.shiftKey || isMouse)){
			obj.fireEvent("selected", {
				range: {
					location: startPos,
					length: obj.value.substring(startPos,endPos).length
				}
			});
			return true;
		}
		return false;
	}
	
	function iOSFix() {
		if (timeoutId) {
			return;
		}
		timeoutId = setTimeout(function() {
			timeoutId = null;
			if (!isSelected({shiftKey: false}, true)) {
				iOSFix();
			} 
		}, 500);
	};
	
	on(domNode, "keyup", function(evt) {
		isSelected(evt, false);
		isIOS && iOSFix();
	});

	on(domNode, "mouseup", function(evt) {
		isSelected(evt, true);
		isIOS && iOSFix();
	});
});
