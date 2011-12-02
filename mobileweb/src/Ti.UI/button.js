Ti._5.createClass('Titanium.UI.Button', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(obj, 'button', args, 'Button');
	Ti._5.Clickable(obj);
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);

	// Properties
	var _title = '', _titleObj;
	Ti._5.prop(obj, 'title', '',
		function() {
			return _title ? _title : obj.dom.innerHTML;
		},
		function(val) {
			_title = val;
			if(_titleObj) {
				obj.dom.removeChild(_titleObj);
			}
			_titleObj = document.createTextNode(_title);
			obj.dom.appendChild(_titleObj);
		});
	
	var _image = null, _imageObj;
	Ti._5.prop(obj, 'image', null,
		function() {
			return _image;
		},
		function(val){
			if (_imageObj == null) {
				_imageObj = document.createElement('img');
				if(_titleObj){
					// insert image before title
					obj.dom.insertBefore(_imageObj, _titleObj);
				} else {
					obj.dom.appendChild(_imageObj);
				}
			}
			_image = Ti._5.getAbsolutePath(val);
			_imageObj.src = _image;
		});

	var _backgroundImage = null;
	var _borderWidthCache = '', _backgroundImageCache = '', _backgroundColorCache = '';
	Ti._5.prop(obj, 'backgroundImage', null,
		function() {
			return _backgroundImage;
		},
		function(val) {
			_backgroundImage = val;

			if (val) {
				// cache borderWidth, backgroundColor to restore them later
				_borderWidthCache = obj.borderWidth;
				_backgroundColorCache = obj.dom.style.backgroundColor;
				obj.dom.style.borderWidth = 0;
				obj.dom.style.backgroundColor = 'transparent';
				obj.dom.style.backgroundImage = 'url("' + Ti._5.getAbsolutePath(val) + '")';
			} else {
				obj.dom.style.borderWidth = _borderWidthCache;
				obj.dom.style.backgroundColor = _backgroundColorCache;
				obj.dom.style.backgroundImage = '';
			}
		});

	var _enabled = true;
	Ti._5.prop(obj, 'enabled', null,
		function() {
			return _enabled;
		},
		function(val) {
			// do nothing if widget is already in this state
			if(_enabled == val){
				return;
			}
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
		});
	
	var _backgroundDisabledImage = null;
	Ti._5.prop(obj, 'backgroundDisabledImage', null,
		function() {
			return _backgroundDisabledImage ? _backgroundDisabledImage : '';
		},
		function(val) {
			_backgroundDisabledImage = val;
		});
	
	var _backgroundDisabledColor = null;
	Ti._5.prop(obj, 'backgroundDisabledColor', null,
		function() {
			return _backgroundDisabledColor ? _backgroundDisabledColor : '';
		},
		function(val) {
			_backgroundDisabledColor = val;
		});
	
	Ti._5.prop(obj, 'size', null,
		function() {
			return {
				width	: obj.width,
				height	: obj.height
			}
		},
		function(val) {
			if (val.width) {
				obj.width = val.width;
			}
			if (val.height) {
				obj.height = val.height;
			}
		});

	var _selectedColor = null, _prevTextColor = null, _selectedColorLoaded = false;
	Ti._5.prop(obj, 'selectedColor', null,
		function() {
			return _selectedColor;
		},
		function(val) {
			_selectedColor = val;
			if (!_selectedColorLoaded) {
				_selectedColorLoaded = true;
				obj.dom.addEventListener('focus', function() {
					_prevTextColor = obj.color;
					obj.color = _selectedColor;
				}, false);
				obj.dom.addEventListener('blur', function() {
					if (_prevTextColor) {
						obj.color = _prevTextColor;
					}
				}, false);
			}
		});
	
	Ti._5.prop(obj, 'style');

	var _titleid = null;
	Ti._5.prop(obj, 'titleid', null,
		function() {
			return _titleid;
		},
		function(val) {
			_titleid = val;
			return obj.title = L(_titleid);
		});
		
	obj.add = function(view) {
		obj._children = obj._children || [];
		obj._children.push(view);
		
		// if we have been rendered and add is called - re-render
		if (
			!obj._rendered ||
			!obj.parent || !obj.parent.dom || 
			!obj.dom.offsetHeight && !obj.dom.offsetWidth || 
			!obj.parent.dom.offsetHeight && !obj.parent.dom.offsetWidth
		) {
			return;
		}
		obj.render(null);
	};
	
	require.mix(obj, args);
});
