(function(oParentNamespace) {
	// Create interface
	oParentNamespace.Positionable = function(obj, args) {
		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}
		
		var _position = function(p, val) {
			obj.dom.style.position = 'absolute';
			obj.dom.style[p] = Ti._5.parseLength(val);
		};
		
		var _top = null;
		Object.defineProperty(obj, 'top', {
			get: function() {
				return _top;
			},
			set: function(val) {
				if (obj.dom.style['bottom']) {
					obj.dom.style['bottom'] = '';
				}
				_top = val;
				_position('top', val);
			},
			configurable: true
		});

		var _bottom;
		Object.defineProperty(obj, 'bottom', {
			get: function() {
				return _bottom;
			},
			set: function(val) {
				if (obj.dom.style['top']) {
					obj.dom.style['top'] = '';
				}
				_bottom = val;
				_position('bottom', val);
			},
			configurable: true
		});

		var _left;
		Object.defineProperty(obj, 'left', {
			get: function() {
				return _left;
			},
			set: function(val) {
				if (obj.dom.style['right']) {
					obj.dom.style['right'] = '';
				}
				obj.dom.style.cssFloat = '';
				_left = val;
				_position('left', val);
			},
			configurable: true
		});		

		var _right;
		Object.defineProperty(obj, 'right', {
			get: function() {
				return _right;
			},
			set: function(val) {
				if (obj.dom.style['left']) {
					obj.dom.style['left'] = '';
				}
				obj.dom.style.cssFloat = 'right';
				_right = val;
				_position('right', val);
			},
			configurable: true
		});	
		
		var _width;
		Object.defineProperty(obj, 'width', {
			get: function() {
				return _width;
			},
			set: function(val) {
				_width = val;
				obj.dom.style.width = Ti._5.parseLength(val);
			},
			configurable: true
		});	
		
		var _height;
		Object.defineProperty(obj, 'height', {
			get: function() {
				return _height;
			},
			set: function(val) {
				_height = val;
				obj.dom.style.height =  Ti._5.parseLength(val);
			},
			configurable: true
		});

		var _center, isAdded = false;
		Object.defineProperty(obj, 'center', {
			get: function() {
				return _center;
			},
			set: function(val) {
				_center = val;
				if(val == null || val.x == null && val.y == null || obj.parent == null){
					return;
				}
				obj.dom.style.position = 'absolute';
				var width = obj.dom.clientWidth;
				var height = obj.dom.clientHeight;
				if(val.x != null){
					var left = val.x;
					if(left.toString().indexOf('%') > 0){
						left = obj.parent.dom.clientWidth * (parseFloat(left) / 100);
					}
					_position('left', left - width/2);
				}
				if(val.y != null){
					var top = val.y;
					if(top.toString().indexOf('%') > 0){
						top = obj.parent.dom.clientHeight * (parseFloat(top) / 100);
					}
					_position('top', top - height/2);
				}
				if (!isAdded) {
					// recalculate center positioning on window resize
					window.addEventListener('resize', function(){obj.center = obj.center}, false);
					isAdded = true;
				}
			},
			configurable: true
		});

		obj.addEventListener('html5_added', function(parent){
			// reset coordinates when element is added somewhere
			obj.center = _center;
		});
		
		obj.addEventListener('html5_shown', function(parent){
			// reset coordinates when element is added somewhere
			obj.center = _center;
		});
		
		obj.addEventListener('html5_child_rendered', function(parent){
			// reset coordinates when element is added somewhere
			obj.center = _center;
		});

		if(args && args.center != null) {
			// ignore other position properties when 'center' is passed
			delete args.top;
			delete args.bottom;
			delete args.left;
			delete args.right;
		}

		//
		// setup getters/setters
		//
		oParentNamespace.preset(obj, ['top', 'bottom', 'left', 'right', 'center', 'width', 'height'], args);
	}
	
})(Ti._5);	
