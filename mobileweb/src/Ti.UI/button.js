Ti._5.createClass("Ti.UI.Button", function(args){
	var obj = this,
		domNode = Ti._5.DOMView(obj, "button", args, "Button"),
		_title = "",
		_titleObj,
		_image,
		_imageObj,
		_backgroundImage = null,
		_borderWidthCache = "",
		_backgroundImageCache = "",
		_backgroundColorCache = "",
		_enabled = true,
		_backgroundDisabledImage = null,
		_backgroundDisabledColor = null,
		_selectedColor = null,
		_prevTextColor = null,
		_selectedColorLoaded = false,
		_titleid = null;

	// Interfaces
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

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
		backgroundImage: {
			get: function() {
				return _backgroundImage;
			},
			set: function(val) {
				_backgroundImage = val;
	
				if (val) {
					// cache borderWidth, backgroundColor to restore them later
					_borderWidthCache = obj.borderWidth;
					_backgroundColorCache = obj.dom.style.backgroundColor;
					obj.dom.style.borderWidth = 0;
					obj.dom.style.backgroundColor = "transparent";
				} else {
					obj.dom.style.borderWidth = _borderWidthCache;
					obj.dom.style.backgroundColor = _backgroundColorCache;
				}
				obj.dom.style.backgroundImage = require("Ti/_/style").url(val);
			}
		},
		enabled: {
			get: function(){return _enabled;},
			set: function(val) {
				// do nothing if widget is already in obj state
				if(_enabled !== val){
					_enabled = val;
					if(_enabled) {
						obj.dom.disabled = false;
						if(_backgroundImageCache){
							obj.backgroundImage = _backgroundImageCache;
						}
						if(_backgroundColorCache){
							obj.backgroundColor = _backgroundColorCache;
						}
		
						_backgroundImageCache = null;
						_backgroundColorCache = null;
					} else {
						obj.dom.disabled = true;
						if (_backgroundDisabledImage) {
							if (obj.backgroundImage) {
								_backgroundImageCache = obj.backgroundImage;
							}
							obj.backgroundImage = _backgroundDisabledImage;
						}
						if (_backgroundDisabledColor) {
							if (obj.backgroundColor) {
								_backgroundColorCache = obj.backgroundColor;
							}
							obj.backgroundColor = _backgroundDisabledColor;
						}
					}
				}
			}
		},
		image: {
			get: function() {return _image;},
			set: function(val){
				if (_imageObj == null) {
					_imageObj = document.createElement("img");
					if(_titleObj){
						// insert image before title
						obj.dom.insertBefore(_imageObj, _titleObj);
					} else {
						obj.dom.appendChild(_imageObj);
					}
				}
				_image = require("Ti/_").getAbsolutePath(val);
				_imageObj.src = _image;
			}
		},
		selectedColor: {
			get: function(){return _selectedColor;},
			set: function(val) {
				_selectedColor = val;
				if (!_selectedColorLoaded) {
					_selectedColorLoaded = true;
					require.on(obj.dom, "focus", function() {
						_prevTextColor = obj.color;
						obj.color = _selectedColor;
					});
					require.on(obj.dom, "blur", function() {
						_prevTextColor && (obj.color = _prevTextColor);
					});
				}
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
		},
		style: null,
		title: {
			get: function() {return _title || obj.dom.innerHTML;},
			set: function(val) {
				_title = val;
				_titleObj && obj.dom.removeChild(_titleObj);
				_titleObj = document.createTextNode(_title);
				obj.dom.appendChild(_titleObj);
			}
		},
		titleid: {
			get: function(){return _titleid;},
			set: function(val){obj.title = L(_titleid = val);}
		}
	});

	obj.add = function(view) {
		obj._children = obj._children || [];
		obj._children.push(view);

		// if we have been rendered and add is called - re-render
		obj._rendered && obj.parent && obj.parent.dom && (obj.dom.offsetHeight || obj.dom.offsetWidth) && (obj.parent.dom.offsetHeight || obj.parent.dom.offsetWidth) && obj.render(null);
	};

	require.mix(obj, args);
});
