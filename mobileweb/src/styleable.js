var spinningAngle = 0;
(function(oParentNamespace) {
	// Create object
	oParentNamespace.Styleable = function(obj, args) {
		args = args || {};
		
		if (!obj.dom) {
			return;
		}
		obj.dom.className += ' HTML5_Styleable';

		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}

		var _backgroundColor = null;
		Object.defineProperty(obj, 'backgroundColor', {
			get: function() {
				return _backgroundColor ? _backgroundColor : '';
			},
			set: function(val) {
				_backgroundColor = val;
				obj.dom.style.backgroundColor = _backgroundColor;
			}
		});

		var _focusable = false;
		Object.defineProperty(obj, 'focusable', {
			get: function() {
				return _focusable;
			},
			set: function(val) {
				_focusable = val ? true : false;
			}
		});

		var _backgroundImage = null;
		Object.defineProperty(obj, 'backgroundImage', {
			get: function() {
				return _backgroundImage;
			},
			set: function(val) {
				_backgroundImage = val;
				obj.dom.style.backgroundImage = val ? 'url("' + Ti._5.getAbsolutePath(val) + '")' : '';
			},
			configurable: true
		});
		
		var _backgroundSelectedColor = '', _backgroundSelectedColorLoaded = false,
			_backgroundSelPrevColor = '', _isFocusSelColorFired = false;
		Object.defineProperty(obj, 'backgroundSelectedColor', {
			get: function() {
				return _backgroundSelectedColor ? _backgroundSelectedColor : '';
			},
			set: function(val) {
				_backgroundSelectedColor = val;
				if (!_backgroundSelectedColorLoaded) {
					_backgroundSelectedColorLoaded = true;
					obj.dom.addEventListener('focus', function() {
						if (obj.focusable && !_isFocusSelColorFired) {
							_backgroundSelPrevColor = obj.backgroundColor;
							obj.dom.style.backgroundColor = _backgroundSelectedColor;
						}
						_isFocusSelColorFired = true;
					}, true);
					obj.dom.addEventListener('blur', function() {
						if (obj.focusable) {
							obj.dom.style.backgroundColor = _backgroundSelPrevColor;
						}
						_isFocusSelColorFired = false;
					}, true);
				}
			}
		});
		
		var _backgroundSelectedImage = '', _backgroundSelPrevImage = '', 
			_backgroundSelectedImageLoaded = false, _isFocusSelImgFired = false;
		Object.defineProperty(obj, 'backgroundSelectedImage', {
			get: function() {
				return _backgroundSelectedImage ? _backgroundSelectedImage : '';
			},
			set: function(val) {
				_backgroundSelectedImage = val;
				if (!_backgroundSelectedImageLoaded) {
					_backgroundSelectedImageLoaded = true;
					obj.dom.addEventListener('focus', function() {
						if (_focusable && !_isFocusSelImgFired) {
							_backgroundSelPrevImage = obj.backgroundImage;
							obj.backgroundImage = _backgroundSelectedImage;
						}
						_isFocusSelImgFired = true;
					}, true);
					obj.dom.addEventListener('blur', function() {
						if (_focusable) {
							obj.backgroundImage = _backgroundSelPrevImage;
						}
						_isFocusSelImgFired = false;
					}, true);
				}
			}
		});
		
		var _backgroundFocusedColor = '', _backgroundFocusedColorLoaded = false,
			_backgroundFocPrevColor = '', _isFocusFocColFired = false;
		Object.defineProperty(obj, 'backgroundFocusedColor', {
			get: function() {
				return _backgroundFocusedColor ? _backgroundFocusedColor : '';
			},
			set: function(val) {
				_backgroundFocusedColor = val;
				if (!_backgroundFocusedColorLoaded) {
					_backgroundFocusedColorLoaded = true;
					obj.dom.addEventListener('focus', function() {
						if (_focusable && !_isFocusFocColFired) {
							_backgroundFocPrevColor = obj.backgroundColor;
							obj.dom.style.backgroundColor = _backgroundFocusedColor;
						}
						_isFocusFocColFired = false;
					}, true);
					obj.dom.addEventListener('blur', function() {
						if (_focusable) {
							obj.dom.style.backgroundColor = _backgroundFocPrevColor;
						}
						_isFocusFocColFired = false;
					}, true);
				}
			}
		});
		
		var _backgroundFocusedImage = '', _backgroundFocusedImageLoaded = false, 
			_backgroundFocPrevImage = '', _isFocusFocImgFired = false;
		Object.defineProperty(obj, 'backgroundFocusedImage', {
			get: function() {
				return _backgroundFocusedImage ? _backgroundFocusedImage : '';
			},
			set: function(val) {
				_backgroundFocusedImage = val;
				if (!_backgroundFocusedImageLoaded) {
					_backgroundFocusedImageLoaded = true;
					obj.dom.addEventListener('focus', function() {
						if (_focusable && !_isFocusFocImgFired) {
							_backgroundFocPrevImage = obj.backgroundImage;
							obj.backgroundImage = _backgroundFocusedImage;
						}
						_isFocusFocImgFired = false;
					}, true);
					obj.dom.addEventListener('blur', function() {
						if (_focusable) {
							obj.backgroundImage = _backgroundFocPrevImage;
						}
						_isFocusFocImgFired = false;
					}, true);
				}
			}
		});
		
		var _borderWidth = null;
		Object.defineProperty(obj, 'borderWidth', {
			get: function() {
				return _borderWidth;
			},
			set: function(val) {
				_borderWidth = val;
				obj.dom.style.borderWidth = val + 'px';
				if(_borderColor == null){
					obj.dom.style.borderColor = 'black';
				}
				obj.dom.style.borderStyle = 'solid';
			}
		});
		
		var _borderColor;
		Object.defineProperty(obj, 'borderColor', {
			get: function() {
				return _borderColor;
			},
			set: function(val) {
				_borderColor = val;
				obj.dom.style.borderColor = _borderColor;
				if(_borderWidth == null){
					obj.dom.style.borderWidth = '1px';
				}
				if(!_borderColor) {
					obj.dom.style.borderWidth = '';
				} else {
					obj.dom.style.borderStyle = 'solid';
				}
			}
		});

		Object.defineProperty(obj, 'borderRadius', {
			get: function() {
				return obj.dom.style.borderRadius ? parseInt(obj.dom.style.borderRadius) : '';
			},
			set: function(val) {
				obj.dom.style.borderRadius = parseInt(val) + 'px';
			}
		});
		
		Object.defineProperty(obj, 'font', {
			get: function() {
				return {'fontVariant':_fontVariant, 'fontStyle':_fontStyle, 'fontWeight':_fontWeight, 'fontSize':_fontSize, 'fontFamily':_fontFamily};
			},
			set: function(val) {
				if(val == null){
					return;
				}

				if(val.fontVariant){
					obj.fontVariant = val.fontVariant;
				}
				if(val.fontStyle){
					obj.fontStyle = val.fontStyle;
				}
				if(val.fontWeight){
					obj.fontWeight = val.fontWeight;
				}
				if(val.fontSize){
					obj.fontSize = val.fontSize;
				}
				if(val.fontFamily){
					obj.fontFamily = val.fontFamily;
				}
			}
		});
		
		var _fontVariant;
		Object.defineProperty(obj, 'fontVariant', {
			get: function() {
				return _fontVariant;
			},
			set: function(val) {
				_fontVariant = val;
				obj.dom.style.fontVariant = val;
			}
		});

		var _fontStyle;
		Object.defineProperty(obj, 'fontStyle', {
			get: function() {
				return _fontStyle;
			},
			set: function(val) {
				_fontStyle = val;
				obj.dom.style.fontStyle = val;
			}
		});

		var _fontWeight;
		Object.defineProperty(obj, 'fontWeight', {
			get: function() {
				return _fontWeight;
			},
			set: function(val) {
				_fontWeight = val;
				obj.dom.style.fontWeight = val;
			}
		});

		var _fontSize;
		Object.defineProperty(obj, 'fontSize', {
			get: function() {
				return _fontSize;
			},
			set: function(val) {
				_fontSize = val;
				obj.dom.style.fontSize = val;
			}
		});

		var _fontFamily;
		Object.defineProperty(obj, 'fontFamily', {
			get: function() {
				return _fontFamily;
			},
			set: function(val) {
				_fontFamily = val;
				obj.dom.style.fontFamily = val;
			}
		});
		
		Object.defineProperty(obj, 'opacity', {
			get: function() {
				return obj.dom.style.opacity ? parseInt(obj.dom.style.opacity) : '';
			},
			set: function(val) {
				obj.dom.style.opacity = val;
			}
		});
		
		Object.defineProperty(obj, 'zIndex', {
			get: function() {
				return obj.dom.style.zIndex;
			},
			set: function(val) {
				if (val != obj.zIndex) {
					obj.dom.style.position = 'absolute';
					obj.dom.style.zIndex = val;
				}
			}
		});
		
		var _gradient = {};
		Object.defineProperty(obj, 'backgroundGradient', {
			get: function() {
				return _gradient ? _gradient : obj.dom.style['background'];
			},
			set: function(val) {
				if (!val) {
					return;
				}
				var type = val['type'] ? val['type']+',' : 'linear,';
				if ('Firefox' == Titanium.Platform.name) {
					var startPoint = val['startPoint'] ? val['startPoint'].x+'%' : '0%';
				} else {
					startPoint = val['startPoint'] ? val['startPoint'].x+' '+val['startPoint'].y+',' : '0% 0%,';
				}
				if ('Firefox' == Titanium.Platform.name) {
					var endPoint = val['endPoint'] ? val['endPoint'].y+'%,' : '100%';
				} else {
					endPoint = val['endPoint'] ? val['endPoint'].x+' '+val['endPoint'].y+',' : '100% 100%,';
				}
				var startRadius = val['startRadius'] ? val['startRadius']+',' : '';
				var endRadius = val['endRadius'] ? val['endRadius']+',' : '';
				var colors = '';
				if (val['colors']) {
					var iStep = 0;
					for (var iCounter=0; iCounter < val['colors'].length; iCounter++) {
						if ('Firefox' == Titanium.Platform.name) {
							colors += 0 < colors.length ? ','+val['colors'][iCounter] : val['colors'][iCounter];
						} else {
							if ('undefined' != typeof val['colors'][iCounter]['position']) {
								colors += 'color-stop('+val['colors'][iCounter]['position']+','+val['colors'][iCounter]['color']+'), ';
							} else {
								iStep = 1 < val['colors'].length ? iCounter/(val['colors'].length-1) : 0;
								colors += 'color-stop('+iStep+','+val['colors'][iCounter]+'), ';
							}
						}
					}
					_gradient = {colors : val['colors']};
				}
				_gradient.type = type;
				_gradient.startPoint = startPoint;
				_gradient.endPoint = endPoint;
				_gradient.startRadius = null;
				_gradient.endRadius = null;
				if ('linear,' == type) {
					_gradient = {
						type		: type,
						startPoint	: startPoint,
						endPoint	: endPoint,
						startRadius	: startRadius,
						endRadius	: endRadius,
						
					};
					var sStyle = [type, startPoint, endPoint, colors].join(' ').replace(/,\s$/g, '');
				} else {
					_gradient.startRadius = startRadius;
					_gradient.endRadius = endRadius;
					var sStyle = [type, startPoint, startRadius, endPoint, endRadius, colors].join(' ').replace(/,\s$/g, '');
				}
				
				if ('Firefox' == Titanium.Platform.name) {
					if (-1 < type.indexOf('linear')) {
						sStyle = [startPoint, endPoint, colors].join(' ').replace(/,\s$/g, '');
						obj.dom.style['background'] = '-moz-linear-gradient(' + sStyle + ')';
					} else {
						sStyle = [startRadius.replace(/,$/g, ''), endRadius, colors].join(' ').replace(/,\s$/g, '');
						obj.dom.style['background'] = '-moz-radial-gradient(' + sStyle + ')';
					}
				} else {
					obj.dom.style['background'] = '-webkit-gradient(' + sStyle + ')';
				}
				// If gradient removed, we need to return background color and image
				if (
					'linear,' == type && '0% 0%,' == startPoint && '100% 100%,' == endPoint &&
					'' == colors
				) {
					obj.backgroundColor = _backgroundColor;
					obj.backgroundImage = obj.backgroundImage;
				}
			}
		});
		
		var _visible = true;
		Object.defineProperty(obj, 'visible', {
			get: function() {
				return _visible;
			},
			set: function(val) {
				val ? obj.show() : obj.hide();
			},
			configurable: true
		});
		
		Object.defineProperty(obj, 'color', {
			get: function() {return obj.dom.style.color ? obj.dom.style.color : '';},
			set: function(val) {obj.dom.style.color = val;},
			configurable: true
		});
	
		//
		// API Methods
		//
		obj.add = function(view) {
			obj._children = obj._children || [];

			// creating cross-link
			obj._children.push(view);
			view.parent = obj;

			obj.render(null);
		};
		obj.remove = function(view) {
			if(obj.dom != null && view.dom.parentNode){
				obj.dom.removeChild(view.dom);
			}
			for(var ii = 0; ii < obj._children.length; ii++){
				if(view === obj._children[ii]){
					obj._children.splice(ii, 1);
				}
			}
			obj.render(null);
		};
		var _prevDisplay = '';
		obj.show = function() {
			obj.dom.style.display = _prevDisplay ? _prevDisplay : '';
			_visible = true;
			obj.fireEvent('html5_shown');
		};
		// Fire event for all children
		obj.addEventListener('html5_shown', function(){
			if (obj._children) {
				for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
					obj._children[iCounter].fireEvent('html5_shown');
				}
			}
		});
		obj.hide = function() {
			if ('none' != obj.dom.style.display) {
				_prevDisplay = obj.dom.style.display;
				obj.dom.style.display = 'none';
			}
			_visible = false;
			obj.fireEvent('html5_hidden');
		};
		// Fire event for all children
		obj.addEventListener('html5_hidden', function(){
			if (obj._children) {
				for (var iCounter=0; iCounter < obj._children.length; iCounter++) {
					obj._children[iCounter].fireEvent('html5_hidden');
				}
			}
		});
		obj._setPrefixedCSSRule = function(rule,value) {
			var style = obj.dom.style,
				possibleRuleNames = ["Moz" + rule,"Webkit" + rule,"O" + rule,"ms" + rule,rule];
			for (var i = 0; i < 5; i++) {
				var prefixedRule = possibleRuleNames[i];
				if (prefixedRule in style) {
					style[prefixedRule] = value;
				}
			}
		}
		obj._getPrefixedCSSRuleValue = function(rule) {
			var style = obj.dom.style,
				possibleRuleNames = ["Moz" + rule,"Webkit" + rule,"O" + rule,"ms" + rule,rule];
			for (var i = 0; i < 5; i++) {
				var prefixedRule = possibleRuleNames[i];
				if (prefixedRule in style) {
					return style[prefixedRule];
				}
			}
		}
		obj.animate = function(animation,callback) {
			
			// Set default values
			animation.duration = (animation.duration ? animation.duration : 0);
			animation.delay = (animation.delay ? animation.delay : 0);
			
			var _curve = "ease";
			switch(animation.curve) {
				case Ti.UI.ANIMATION_CURVE_LINEAR: _curve = "linear"; break;
				case Ti.UI.ANIMATION_CURVE_EASE_IN: _curve = "ease-in"; break;
				case Ti.UI.ANIMATION_CURVE_EASE_OUT: _curve = "ease-out"; break;
				case Ti.UI.ANIMATION_CURVE_EASE_IN_OUT: _curve = "ease-in-out"; break;
			}
			
			// Create the transition, must be set before setting the other properties
			var transitionValue = "all " + animation.duration + "ms " + _curve;
			animation.delay && (transitionValue += " " + animation.delay + "ms");
			obj._setPrefixedCSSRule("Transition", transitionValue);
			
			// Set the color and opacity properties
			var _style = obj.dom.style;
			animation.backgroundColor && (_style.backgroundColor = animation.backgroundColor);
			animation.color && (_style.color = animation.color);
			(animation.opaque === true || animation.visible === true) && (_style.opacity = 1.0);
			(animation.opaque === false || animation.visible === false) && (_style.opacity = 0.0);
			animation.opacity && (_style.opacity = animation.opacity);
			
			// Set the position and size properties
			animation.center && (_style.center = animation.center);
			animation.top && (_style.top = animation.top);
			animation.bottom && (_style.bottom = animation.bottom);
			animation.left && (_style.left = animation.left);
			animation.right && (_style.right = animation.right);
			animation.height && (_style.height = animation.height);
			animation.width && (_style.width = animation.width);
			
			// Set the z-order
			animation.zIndex && (_style.zIndex = animation.zIndex);
			
			// Set the transform properties
			var transform = "";
			if (animation.rotation) {
				if(obj._currentRotation) {
					obj._currentRotation += animation.rotation;
				} else {
					obj._currentRotation = animation.rotation;
				}
				transform += "rotate(" + obj._currentRotation + "deg) ";
			}
			if (animation.transform) {
				if (obj._currentTransform) {
					obj._currentTransform = obj._currentTransform.multiply(animation.transform);
				} else {
					obj._currentTransform = animation.transform;
				}
				transform += obj._currentTransform._toCSS();
			}
			obj._setPrefixedCSSRule("Transform",transform);
			
			if(callback) {
				// Note: no IE9 support for transitions, so instead we just set a timer that matches the duration so things don't break
				setTimeout(function(){
					// Clear the transform so future modifications in these areas are not animated
					obj._setPrefixedCSSRule("Transition", "");
					callback();
				},animation.duration + animation.delay + 1);
			}
		};
		
		if (args['unselectable']) {
			obj.dom.style['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
		}
	
		// 
		// setup getters/setters
		//
		oParentNamespace.preset(obj, [
			'color', 'border', 'borderWidth', 'borderColor', 'borderRadius',
			'backgroundColor', 'backgroundImage', 'backgroundGradient', 
			'backgroundSelectedColor', 'backgroundFocusedColor', 
			'backgroundSelectedImage', 'backgroundFocusedImage', 
			'fontStyle', 'fontWeight', 'fontSize', 'fontFamily', 'font', 'opacity', 'zIndex', 
			'visible', 'focusable'
		], args);
	};
})(Ti._5);	
