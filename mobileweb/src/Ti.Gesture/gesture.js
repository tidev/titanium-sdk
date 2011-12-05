(function(api){
	// Interfaces
	Ti._5.EventDriven(api);
	
	var _lastOrient = null;
	
	window.addEventListener("orientationchange", function(event) {
		var orient = Ti.UI.UNKNOWN;
		switch(window.orientation) {
			case 0:
				orient = Ti.UI.PORTRAIT;
				break;
			case 90:
				orient = Ti.UI.LANDSCAPE_LEFT;
				break;
			case -90:
				orient = Ti.UI.LANDSCAPE_RIGHT;
				break;
			case 180:
				orient = Ti.UI.UPSIDE_PORTRAIT;
				break;
		}
		if (_lastOrient != orient) {
			_lastOrient = orient;
			api.fireEvent('orientationchange', {
				orientation: orient,
				source: event.source,
				type: 'orientationchange'
			})
		}
	}, false);
	window.addEventListener("deviceorientation", function(event) {
		var orient = null, _deltaOrient = 5, _deltaTop = 170;
		var angles = {
			alpha: event.alpha || event.x,
			beta: event.beta || event.y,
			gamma: event.gamma || event.z
		};
		if (
			Math.abs(angles.beta) < _deltaOrient &&
			Math.abs(angles.gamma) > _deltaTop
		){
			orient = Ti.UI.FACE_DOWN;
		}
		if (
			Math.abs(angles.beta) < _deltaOrient &&
			Math.abs(angles.gamma) < _deltaOrient
		){
			orient = Ti.UI.FACE_UP;
		}
		if (
			Math.abs(angles.beta) > 50 && 
			0 > angles.beta &&
			_lastOrient != orient
		){
			orient = Ti.UI.UPSIDE_PORTRAIT;
		}
		if (null != orient && _lastOrient != orient) {
			_lastOrient = orient;
			api.fireEvent('orientationchange', {
				orientation: orient,
				source: event.source,
				type: 'orientationchange'
			});
		}
    }, false);
	
	var _tLastShake = new Date(), _lastAccel = {}; 
	// need some delta for coordinates changed
	var _delta = 10;
	window.addEventListener("devicemotion", function(event) {
		var e = event.acceleration || event.accelerationIncludingGravity,
			accel = e && {
				x: e.x,
				y: e.y,
				z: e.z
			};
		if (accel) {
			if (_lastAccel.x || _lastAccel.y || _lastAccel.z) {
				if (
					((Math.abs(_lastAccel.x - accel.x) > _delta) && (Math.abs(_lastAccel.y - accel.y) > _delta)) || 
					((Math.abs(_lastAccel.x - accel.x) > _delta) && (Math.abs(_lastAccel.z - accel.z) > _delta)) || 
					((Math.abs(_lastAccel.y - accel.y) > _delta) && (Math.abs(_lastAccel.z - accel.z) > _delta))
				) {
					var currentTime = new Date();
					var timeDifference = currentTime.getTime() - _tLastShake.getTime();
					if (timeDifference > 300) {
						_tLastShake = currentTime;
						
						api.fireEvent('shake', {
							source: event.source,
							timestamp: timeDifference,
							type: 'shake'
						})
					}
				}
			}
			_lastAccel = accel;
		}
	}, false);
			
})(Ti._5.createClass('Titanium.Gesture'));
