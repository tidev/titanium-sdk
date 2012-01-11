Ti._5.Positionable = function(obj, args) {
	obj.addEventListener || oParentNamespace.EventDriven(obj);

	var domNode = obj.dom,
		domStyle = domNode.style,
		px = Ti._5.px,
		_top,
		_bottom,
		_left,
		_right,
		_width,
		_height,
		_center,
		isAdded;

	Ti._5.prop(obj, {
		top: {
			get: function() {
				return _top;
			},
			set: function(val) {
				domStyle.bottom && (domStyle.bottom = "");
				domStyle.top = _top = px(val);
			}
		},
		bottom: {
			get: function() {
				return _bottom;
			},
			set: function(val) {
				domStyle.top && (domStyle.top = "");
				domStyle.bottom = _bottom = px(val);
			}
		},
		left: {
			get: function() {
				return _left;
			},
			set: function(val) {
				domStyle.right && (domStyle.right = "");
				domStyle.left = _left = px(val);
			}
		},
		right: {
			get: function() {
				return _right;
			},
			set: function(val) {
				domStyle.left && (domStyle.left = "");
				domStyle.right = _right = px(val);
			}
		},
		width: {
			get: function() {
				return _width;
			},
			set: function(val) {
				domStyle.width = _width = px(val);
			}
		},
		height: {
			get: function() {
				return _height;
			},
			set: function(val) {
				domStyle.height = _height = px(val);
			}
		},
		center: {
			get: function() {
				return _center;
			},
			set: function(val) {
				_center = val;

				if (!val || (val.x === null && val.y === null) || !obj.parent) {
					return;
				}

				var width = domNode.clientWidth,
					height = domNode.clientHeight,
					left = val.x,
					top = val.y;

				if (left !== null) {
					/\%$/.test(left) && (left = obj.parent.dom.clientWidth * parseFloat(left) / 100);
					domStyle.left = (left - width / 2) + "px";
				}

				if(top !== null){
					/\%$/.test(top) && (top = obj.parent.dom.clientHeight * parseFloat(top) / 100);
					domStyle.top = (top - height / 2) + "px";
				}

				if (!isAdded) {
					// recalculate center positioning on window resize
					require.on(window, "resize", function() {
						obj.center = _center;
					});
					isAdded = 1;
				}
			}
		}
	});

	obj.addEventListener("html5_added", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	obj.addEventListener("html5_shown", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	obj.addEventListener("html5_child_rendered", function(){
		// reset coordinates when element is added somewhere
		obj.center = _center;
	});

	if(args && args.center) {
		// ignore other position properties when "center" is passed
		delete args.top;
		delete args.bottom;
		delete args.left;
		delete args.right;
	}

	require.mix(obj, args);
};
