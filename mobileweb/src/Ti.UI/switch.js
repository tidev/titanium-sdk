Ti._5.createClass("Ti.UI.Switch", function(args){
	args = require.mix({
		unselectable: true
	}, args);

	var obj = this,
		on = require.on,
		domNode = Ti._5.DOMView(obj, "div", args, "Switch"),
		checkboxNode = document.createElement("input"),
		_titleContainer = document.createTextNode(""),
		_touchEnabled = true,
		_enabled = true,
		_backgroundDisabledImage = "",
		_backgroundImage = "",
		_backgroundDisabledColor = "",
		_backgroundColor = "",
		_title = "",
		_titleOff = null,
		_titleOn = null;

	// Interfaces
	Ti._5.Touchable(obj, args, true);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	checkboxNode.type =  "checkbox";
	domNode.appendChild(checkboxNode);
	domNode.appendChild(_titleContainer);

	// Properties
	Ti._5.prop(obj, {
		backgroundDisabledColor: {
			get: function() {
				return _backgroundDisabledColor ? _backgroundDisabledColor : "";
			},
			set: function(val) {
				_backgroundDisabledColor = val;
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
		enabled: {
			get: function(){return !checkboxNode.disabled;},
			set: function(val) {
				_enabled = !!val;
				if (!_backgroundImage && obj.backgroundImage) {
					_backgroundImage = obj.backgroundImage;
				}
				if (!_backgroundColor && obj.backgroundColor) {
					_backgroundColor = obj.backgroundColor;
				}
				if (!val || !_touchEnabled) {
					checkboxNode.disabled = "disabled";
					if (_backgroundDisabledImage) {
						obj.backgroundImage = _backgroundDisabledImage;
					}
					if (_backgroundDisabledColor) {
						obj.backgroundColor = _backgroundDisabledColor;
					}
				} else {
					checkboxNode.disabled = "";
					obj.backgroundImage = _backgroundImage;
					obj.backgroundColor = _backgroundColor;
				}
			}
		},
		size: {
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
		style: Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON,
		title: {
			get: function() {return _title ? _title : domNode.innerHTML;},
			set: function(val) {
				if (obj.style == Ti.UI.Android.SWITCH_STYLEcheckboxNode) {
					_title = val;
					domNode.innerHTML = "";
					domNode.appendChild(checkboxNode);
					domNode.appendChild(document.createTextNode(Ti._5._changeTextToHTML(val)));
					obj.render(null);
				}
			}
		},
		titleOff: {
			get: function(){return _titleOff;},
			set: function(val){
				_titleOff = val;
				if (!domNode.checked && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
					obj.title = _titleOff;
				}
			}
		},
		titleOn: {
			get: function(){return _titleOn;},
			set: function(val){
				_titleOn = val; 
				if (domNode.checked && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
					obj.title = _titleOn;
				}
			}
		},
		touchEnabled: {
			get: function() {
				return _touchEnabled ? _touchEnabled : "";
			},
			set: function(val) {
				_touchEnabled = val;
				if (!_touchEnabled) {
					checkboxNode.disabled = "disabled";
				} else {
					obj.enabled = _enabled;
				}
			}
		},
		value: {
			get: function(){return checkboxNode.checked;},
			set: function(val){checkboxNode.checked = val;onCheck(null);}
		}
	});

	require.mix(obj, args);

	function onCheck() {
		if (checkboxNode.checked && _titleOn && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
			obj.title = _titleOn;
		}
		if (!checkboxNode.checked && _titleOff && obj.style == Ti.UI.Android.SWITCH_STYLE_TOGGLEBUTTON) {
			obj.title = _titleOff;
		}
		obj.fireEvent("change", {
			value: checkboxNode.checked
		});
	}

	// Events
	on(domNode, "click", function(evt) {
		if (_touchEnabled && checkboxNode !== evt.target) {
			checkboxNode.checked = !checkboxNode.checked;
			onCheck();
		}
	});

	on(domNode, "touchstart", function(evt) {
		if (_touchEnabled && checkboxNode !== evt.target && checkboxNode.touchstart) {
			checkboxNode.checked = !checkboxNode.checked;
			onCheck();
		}
	});

	// We need this here for firing "click"/"touchstart" & "change" events in native order
	// QUESTION: is there a better way to do this?
	Ti._5.Clickable(obj);

	on(checkboxNode, "change", onCheck);
});
