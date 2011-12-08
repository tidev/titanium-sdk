(function(oParentNamespace) {
	// Create interface
	oParentNamespace.Touchable = function(obj, args, bEmulate) {
		args = args || {};

		if ('function' != typeof obj.addEventListener) {
			oParentNamespace.EventDriven(obj);
		}
		
		// Check for OS that does not support touch events
		if (
			-1 < Titanium.Platform.ostype.indexOf('Win') || 
			-1 < Titanium.Platform.ostype.indexOf('Linux') ||
			-1 < Titanium.Platform.ostype.indexOf('Mac')
		) {
			bEmulate = true;
		}
		
		// Android and iOS5 support touch events
		if (-1 < Titanium.Platform.osname.indexOf('android') ||
		    (
		    (-1 < Titanium.Platform.osname.indexOf('iphone') ||
		     -1 < Titanium.Platform.osname.indexOf('ipad') ||
		     -1 < Titanium.Platform.osname.indexOf('ipod') 	
		    ) && 
		     navigator.userAgent[navigator.userAgent.indexOf('OS')+3] >= 5
		    )
		){
			bEmulate = false;
		}
		
		Ti._5.prop(obj, 'touchEnabled', !!args.touchEnabled);
		
		var _startPoint = null;
		function _fTouchStart (event) {
			if (!obj.touchEnabled) {
				return true;
			}
			var xCoord = event.touches ? event.touches[0].pageX : event.pageX;
			var yCoord = event.touches ? event.touches[0].pageY : event.pageY;
			var oEvent = {
				globalPoint: { x:xCoord, y:yCoord },
				source: obj,
				type: 'touchstart',
				x: xCoord,
				y: yCoord
			};
			_startPoint = oEvent.globalPoint;
			_startPoint.source = event.target;
			_endPoint = oEvent.globalPoint;
			obj.fireEvent('touchstart', oEvent);
			if (event.touches && 2 == event.touches.length) {
				obj.fireEvent('twofingertap',  {
					globalPoint: { x:xCoord, y:yCoord },
					source: obj,
					type: 'twofingertap',
					x: xCoord,
					y: yCoord
				});
			}
		}
		obj.dom.addEventListener(bEmulate ? 'mousedown' : 'touchstart', _fTouchStart, false);
		
		var _endPoint = null;
		function _fTouchMove (event) {
			if (!obj.touchEnabled || bEmulate && !_startPoint) {
				return true;
			}
			var xCoord = event.touches ? event.touches[0].pageX : event.pageX;
			var yCoord = event.touches ? event.touches[0].pageY : event.pageY;
			var oEvent = {
				globalPoint: { x:xCoord, y:yCoord },
				source: obj,
				type: 'touchmove',
				x: xCoord,
				y: yCoord
			};
			_endPoint = oEvent.globalPoint;
			obj.fireEvent('touchmove', oEvent);
		}
		obj.dom.addEventListener(bEmulate ? 'mousemove' : 'touchmove', _fTouchMove, false);
		
		function _fTouchEnd (event) {
			if (!obj.touchEnabled) {
				return true;
			}
			if (!_endPoint) {
				_endPoint = {
					x: event.pageX, 
					y: event.pageY 
				}
			}
			var oEvent = {
				globalPoint: { x:_endPoint.x, y:_endPoint.y },
				source: obj,
				type: 'touchend',
				x: _endPoint.x,
				y: _endPoint.y
			};
			obj.fireEvent('touchend', oEvent);
			if (_startPoint && _startPoint.source) {
				if (_startPoint.source == event.target && 50 <= Math.abs(_endPoint.x - _startPoint.x)) {
					oEvent.direction = _endPoint.x > _startPoint.x ? 'right' : 'left';
					obj.fireEvent('swipe', oEvent);
				}
			}
			_startPoint = null;
			_endPoint = null;
		}
		obj.dom.addEventListener(bEmulate ? 'mouseup' : 'touchend', _fTouchEnd, false);

		obj.dom.addEventListener('touchcancel', function(event) {
			if (!obj.touchEnabled) {
				return true;
			}
			var oEvent = {
				globalPoint: { x:event.pageX, y:event.pageY },
				source: obj,
				type: 'touchcancel',
				x: event.pageX,
				y: event.pageY
			};
			obj.fireEvent('touchcancel', oEvent);
		}, false);
		
		var _isDoubleTap = false;
		obj.dom.addEventListener('click', function(event) {
			if (!obj.touchEnabled) {
				return true;
			}
			var oEvent = {
				globalPoint: { x:event.pageX, y:event.pageY },
				source: obj,
				type: 'singletap',
				x: event.pageX,
				y: event.pageY
			};
			obj.fireEvent('singletap', oEvent);
			if (_isDoubleTap) {
				_isDoubleTap = false;
				obj.fireEvent('doubletap', {
					globalPoint: { x:event.pageX, y:event.pageY },
					source: obj,
					type: 'doubletap',
					x: event.pageX,
					y: event.pageY
				});
			} else {
				_isDoubleTap = true;
				setTimeout(function() { 
					_isDoubleTap = false;
				}, 400);
			}
		}, false);
	}
})(Ti._5);
