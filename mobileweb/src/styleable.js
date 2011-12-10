(function(oParentNamespace) {

	// Create object
	oParentNamespace.Styleable = function(obj, args) {
		args = args || {};

		if (!obj.dom) {
			return;
		}

		var undef,
			on = require.on,
			domNode = obj.dom,
			domStyle = domNode.style,
			ui = Ti.UI,
			px = Ti._5.px,
			curRotation,
			curTransform,
			_backgroundColor,
			_backgroundImage,
			_backgroundFocusPrevColor,
			_backgroundFocusPrevImage,
			_backgroundSelectedPrevColor,
			_backgroundSelectedPrevImage,
			_gradient,
			_visible,
			_prevDisplay = "";

		domNode.className += " HTML5_Styleable";

		obj.addEventListener || oParentNamespace.EventDriven(obj);

		function cssUrl(url) {
			return /^url\(/.test(url) ? url : "url(" + Ti._5.getAbsolutePath(url) + ")";
		}

		function font(val) {
			val = val || {};
			require.each(["fontVariant", "fontStyle", "fontWeight", "fontSize", "fontFamily"], function(f) {
				val[f] = f in val ? domStyle[f] = (f === "fontSize" ? px(val[f]) : val[f]) : domStyle[f];
			});
			return val;
		}

		Ti._5.prop(obj, {
			"backgroundColor": {
				// we keep the backgroundColor in a variable because we later change it
				// when focusing or selecting, so we can't just report the current value
				value: args.backgroundColor,
				get: function() {
					return _backgroundColor || (_backgroundColor = domStyle.backgroundColor);
				},
				set: function(val) {
					return domStyle.backgroundColor = _backgroundColor = val;
				}
			},
			"backgroundFocusedColor": args.backgroundFocusedColor,
			"backgroundFocusedImage": args.backgroundFocusedImage,
			"backgroundGradient": {
				value: args.backgroundGradient,
				get: function() {
					if (!_gradient) {
						// domStyle.backgroundImage
						_gradient = {
							//
						};
					}
					return _gradient;
				},
				set: function(val) {
					return _gradient = val;
					/*
					if (!val) {
						return;
					}
					var type = val["type"] ? val["type"]+"," : "linear,";
					if ("Firefox" == Titanium.Platform.name) {
						var startPoint = val["startPoint"] ? val["startPoint"].x+"%" : "0%";
					} else {
						startPoint = val["startPoint"] ? val["startPoint"].x+" "+val["startPoint"].y+"," : "0% 0%,";
					}
					if ("Firefox" == Titanium.Platform.name) {
						var endPoint = val["endPoint"] ? val["endPoint"].y+"%," : "100%";
					} else {
						endPoint = val["endPoint"] ? val["endPoint"].x+" "+val["endPoint"].y+"," : "100% 100%,";
					}
					var startRadius = val["startRadius"] ? val["startRadius"]+"," : "";
					var endRadius = val["endRadius"] ? val["endRadius"]+"," : "";
					var colors = "";
					if (val["colors"]) {
						var iStep = 0;
						for (var iCounter=0; iCounter < val["colors"].length; iCounter++) {
							if ("Firefox" == Titanium.Platform.name) {
								colors += 0 < colors.length ? ","+val["colors"][iCounter] : val["colors"][iCounter];
							} else {
								if ("undefined" != typeof val["colors"][iCounter]["position"]) {
									colors += "color-stop("+val["colors"][iCounter]["position"]+","+val["colors"][iCounter]["color"]+"), ";
								} else {
									iStep = 1 < val["colors"].length ? iCounter/(val["colors"].length-1) : 0;
									colors += "color-stop("+iStep+","+val["colors"][iCounter]+"), ";
								}
							}
						}
						_gradient = {colors : val["colors"]};
					}
					_gradient.type = type;
					_gradient.startPoint = startPoint;
					_gradient.endPoint = endPoint;
					_gradient.startRadius = null;
					_gradient.endRadius = null;
					if ("linear," == type) {
						_gradient = {
							type		: type,
							startPoint	: startPoint,
							endPoint	: endPoint,
							startRadius	: startRadius,
							endRadius	: endRadius,
							
						};
						var sStyle = [type, startPoint, endPoint, colors].join(" ").replace(/,\s$/g, "");
					} else {
						_gradient.startRadius = startRadius;
						_gradient.endRadius = endRadius;
						var sStyle = [type, startPoint, startRadius, endPoint, endRadius, colors].join(" ").replace(/,\s$/g, "");
					}
					
					if ("Firefox" == Titanium.Platform.name) {
						if (-1 < type.indexOf("linear")) {
							sStyle = [startPoint, endPoint, colors].join(" ").replace(/,\s$/g, "");
							domStyle["background"] = "-moz-linear-gradient(" + sStyle + ")";
						} else {
							sStyle = [startRadius.replace(/,$/g, ""), endRadius, colors].join(" ").replace(/,\s$/g, "");
							domStyle["background"] = "-moz-radial-gradient(" + sStyle + ")";
						}
					} else {
						domStyle["background"] = "-webkit-gradient(" + sStyle + ")";
					}
					// If gradient removed, we need to return background color and image
					if (
						"linear," == type && "0% 0%," == startPoint && "100% 100%," == endPoint &&
						"" == colors
					) {
						obj.backgroundColor = domStyle.backgroundColor;
						obj.backgroundImage = obj.backgroundImage;
					}
					*/
				}
			},
			"backgroundImage": {
				// we keep the backgroundImage in a variable because we later change it
				// when focusing or selecting, so we can't just report the current value
				value: args.backgroundImage,
				get: function() {
					return _backgroundImage = (_backgroundImage = domStyle.backgroundImage);
				},
				set: function(val) {
					return domStyle.backgroundImage = _backgroundImage = val ? cssUrl(val) : "";
				}
			},
			"backgroundSelectedColor": args.backgroundSelectedColor,
			"backgroundSelectedImage": args.backgroundSelectedImage,
			"borderColor": {
				value: args.borderColor,
				get: function() {
					return domStyle.borderColor;
				},
				set: function(val) {
					if (domStyle.borderColor = val) {
						domStyle.borderWidth || (obj.borderWidth = 1);
						domStyle.borderStyle = "solid";
					} else {
						obj.borderWidth = 0;
					}
					return val;
				}
			},
			"borderRadius": {
				value: args.borderRadius,
				get: function() {
					return domStyle.borderRadius || "";
				},
				set: function(val) {
					return domStyle.borderRadius = px(val);
				}
			},
			"borderWidth": {
				value: args.borderWidth,
				get: function() {
					return domStyle.borderWidth;
				},
				set: function(val) {
					domStyle.borderWidth = val = px(val);
					domStyle.borderColor || (domStyle.borderColor = "black");
					domStyle.borderStyle = "solid";
					return val;
				}
			},
			"color": {
				value: args.color,
				get: function() {
					return domStyle.color;
				},
				set: function(val) {
					return domStyle.color = val;
				}
			},
			"focusable": args.focusable,
			"font": {
				value: args.font,
				get: function() {
					return font();
				},
				set: function(val) {
					return font(val);
				}
			},
			"opacity": {
				value: args.opacity,
				get: function() {
					return domStyle.opacity;
				},
				set: function(val) {
					return domStyle.opacity = val;
				}
			},
			"visible": {
				value: args.visible,
				get: function() {
					return _visible;
				},
				set: function(val) {
					return val ? obj.show() : obj.hide();
				}
			},
			"zIndex": {
				value: args.zIndex,
				get: function() {
					return domStyle.zIndex;
				},
				set: function(val) {
					val !== domStyle.zIndex && domStyle.position === "static" && (domStyle.position = "absolute");
					return domStyle.zIndex = val;
				}
			}
		});

		on(domNode, "focus", function() {
			if (obj.focusable) {
				if (obj.backgroundSelectedColor) {
					_backgroundSelectedPrevColor || (_backgroundSelectedPrevColor = obj.backgroundColor);
					domStyle.backgroundColor = obj.backgroundSelectedColor;
				}

				if (obj.backgroundSelectedImage) {
					_backgroundSelectedPrevImage || (_backgroundSelectedPrevImage = obj.backgroundImage);
					domStyle.backgroundImage = cssUrl(obj.backgroundSelectedImage);
				}

				if (obj.backgroundFocusedColor) {
					_backgroundFocusPrevColor || (_backgroundFocusPrevColor = obj.backgroundFocusedColor);
					domStyle.backgroundColor = obj.backgroundFocusedColor;
				}

				if (obj.backgroundFocusedImage) {
					_backgroundFocusPrevImage || (_backgroundFocusPrevImage = obj.backgroundImage);
					domStyle.backgroundImage = cssUrl(obj.backgroundFocusedImage);
				}
			}
		});

		on(domNode, "blur", function() {
			if (obj.focusable) {
				if (_backgroundSelectedPrevColor) {
					domStyle.backgroundColor = _backgroundSelectedPrevColor;
					_backgroundSelectedPrevColor = 0;
				}

				if (_backgroundSelectedPrevImage) {
					domStyle.backgroundImage = cssUrl(_backgroundSelectedPrevImage);
					_backgroundSelectedPrevImage = 0;
				}

				if (_backgroundFocusPrevColor) {
					domStyle.backgroundColor = _backgroundFocusPrevColor;
					_backgroundFocusPrevColor = 0;
				}

				if (_backgroundFocusPrevImage) {
					domStyle.backgroundImage = cssUrl(_backgroundFocusPrevImage);
					_backgroundFocusPrevImage = 0;
				}
			}
		});

		//
		// API Methods
		//
		obj.add = function(view) {
			obj._children.push(view);
			view.parent = obj;
			obj.render();
		};

		obj.remove = function(view) {
			domNode && view.dom.parentNode && domNode.removeChild(view.dom);
			for (var i = 0; i < obj._children.length; i++) {
				view === obj._children[ii] && obj._children.splice(i, 1);
			}
			obj.render();
		};

		obj.show = function() {
			domStyle.display = _prevDisplay || "";
			obj.fireEvent("html5_shown");
			return _visible = true;
		};

		// Fire event for all children
		obj.addEventListener("html5_shown", function() {
			require.each(obj._children, function(c) { c.fireEvent("html5_shown"); });
		});

		obj.hide = function() {
			if (domStyle.display !== "none") {
				_prevDisplay = domStyle.display;
				domStyle.display = "none";
			}
			obj.fireEvent("html5_hidden");
			return _visible = false;
		};

		// Fire event for all children
		obj.addEventListener("html5_hidden", function(){
			require.each(obj._children, function(c) { c.fireEvent("html5_hidden"); });
		});

		obj.css = function(rule, value) {
			var i = 0,
				r,
				upperCaseRule = rule[0].toUpperCase() + rule.substring(1),
				vp = require.config.vendorPrefixes;

			for (; i < vp.length; i++) {
				r = vp[i];
				r += r ? upperCaseRule : rule;
				if (r in domStyle) {
					return value !== undefined ? domStyle[r] = value : domStyle[r];
				}
			}
		};

		obj.animate = function(anim, callback) {
			var curve = "ease",
				transform = "";

			switch (anim.curve) {
				case ui.ANIMATION_CURVE_LINEAR: curve = "linear"; break;
				case ui.ANIMATION_CURVE_EASE_IN: curve = "ease-in"; break;
				case ui.ANIMATION_CURVE_EASE_OUT: curve = "ease-out"; break
				case ui.ANIMATION_CURVE_EASE_IN_OUT: curve = "ease-in-out";
			}

			anim.duration = anim.duration || 0;
			anim.delay = anim.delay || 0;

			// Determine which coordinates are valid and combine with previous coordinates where appropriate.
			if (anim.center) {
				anim.left = anim.center.x - domNode.offsetWidth / 2;
				anim.top = anim.center.y - domNode.offsetHeight / 2;
			}

			// Create the transition, must be set before setting the other properties
			obj.css("transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));

			// Set the color and opacity properties
			anim.backgroundColor !== undef && (obj.backgroundColor = anim.backgroundColor);

			domStyle.opacity = anim.opaque && anim.visible ? 1.0 : 0.0;

			// Set the position and size properties
			require.each(["top", "bottom", "left", "right", "height", "width"], function(p) {
				anim[p] !== undef && (domStyle[p] = px(anim[p]));
			});

			// Set the z-order
			anim.zIndex !== undef && (domStyle.zIndex = anim.zIndex);

			// Set the transform properties
			if (anim.rotation) {
				curRotation = curRotation | 0 + anim.rotation;
				transform += "rotate(" + curRotation + "deg) ";
			}

			if (anim.transform) {
				curTransform = curTransform ? curTransform.multiply(anim.transform) : anim.transform;
				transform += curTransform.toCSS();
			}

			obj.css("transform", transform);

			if (callback) {
				// Note: no IE9 support for transitions, so instead we just set a timer that matches the duration so things don"t break
				setTimeout(function() {
					// Clear the transform so future modifications in these areas are not animated
					obj.css("transition", "");
					callback();
				}, anim.duration + anim.delay + 1);
			}
		};

		args["unselectable"] && (domStyle["-webkit-tap-highlight-color"] = "rgba(0,0,0,0)");
	};
})(Ti._5);	
