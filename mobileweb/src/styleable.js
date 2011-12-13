Ti._5.Styleable = function(obj, args) {
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
		vendorPrefixes = require.config.vendorPrefixes,
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

	function unitize(x) {
		return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
	}

	Ti._5.prop(obj, {
		backgroundColor: {
			// we keep the backgroundColor in a variable because we later change it
			// when focusing or selecting, so we can't just report the current value
			get: function() {
				return _backgroundColor || (_backgroundColor = domStyle.backgroundColor);
			},
			set: function(val) {
				domStyle.backgroundColor = _backgroundColor = val;
			}
		},
		backgroundFocusedColor: undef,
		backgroundFocusedImage: undef,
		backgroundGradient: {
			get: function() {
				return _gradient;
			},
			set: function(val) {
				var val = _gradient = val || {},
					output = [],
					colors = val.colors || [],
					type = val.type,
					start = val.startPoint,
					end = val.endPoint;

				if (type === "linear") {
					start && end && start.x != end.x && start.y != end.y && output.concat([
						unitize(val.startPoint.x) + " " + unitize(val.startPoint.y),
						unitize(val.endPoint.x) + " " + unitize(val.startPoint.y)
					]);
				} else if (type === "radial") {
					start = val.startRadius;
					end = val.endRadius;
					start && end && output.push(unitize(start) + " " + unitize(end));
					output.push("ellipse closest-side");
				} else {
					domStyle.backgroundImage = "none";
					return;
				}

				require.each(colors, function(c) {
					output.push(c.color ? c.color + " " + (c.position * 100) + "%" : c);
				});

				output = type + "-gradient(" + output.join(",") + ")";

				require.each(vendorPrefixes.css, function(p) {
					domStyle.backgroundImage = p + output;
				});
			}
		},
		backgroundImage: {
			// we keep the backgroundImage in a variable because we later change it
			// when focusing or selecting, so we can't just report the current value
			get: function() {
				return _backgroundImage = (_backgroundImage = domStyle.backgroundImage);
			},
			set: function(val) {
				domStyle.backgroundImage = _backgroundImage = val ? cssUrl(val) : "";
			}
		},
		backgroundSelectedColor: undef,
		backgroundSelectedImage: undef,
		borderColor: {
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
			}
		},
		borderRadius: {
			get: function() {
				return domStyle.borderRadius || "";
			},
			set: function(val) {
				domStyle.borderRadius = px(val);
			}
		},
		borderWidth: {
			get: function() {
				return domStyle.borderWidth;
			},
			set: function(val) {
				domStyle.borderWidth = val = px(val);
				domStyle.borderColor || (domStyle.borderColor = "black");
				domStyle.borderStyle = "solid";
			}
		},
		color: {
			get: function() {
				return domStyle.color;
			},
			set: function(val) {
				domStyle.color = val;
			}
		},
		focusable: undef,
		font: {
			get: function() {
				return font();
			},
			set: function(val) {
				font(val);
			}
		},
		opacity: {
			get: function() {
				return domStyle.opacity;
			},
			set: function(val) {
				domStyle.opacity = val;
			}
		},
		visible: {
			get: function() {
				return _visible;
			},
			set: function(val) {
				val ? obj.show() : obj.hide();
			}
		},
		zIndex: {
			get: function() {
				return domStyle.zIndex;
			},
			set: function(val) {
				val !== domStyle.zIndex && domStyle.position === "static" && (domStyle.position = "absolute");
				domStyle.zIndex = val;
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
			vp = vendorPrefixes.dom,
			upperCaseRule = rule[0].toUpperCase() + rule.substring(1);

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

	require.mix(obj, args);
};