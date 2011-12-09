(function(api){
	// Interfaces
	Ti._5.EventDriven(api);
	
	var _tLastShake = new Date(), _lastAccel = null; 
	// need some delta for coordinates changed
	var _delta = 0.2;
	
	window.addEventListener("devicemotion", function (event) {
		var e = event.acceleration || event.accelerationIncludingGravity,
			accel = e && {
				x: e.x,
				y: e.y,
				z: e.z
			};
		if (accel) {
			_lastAccel = null == _lastAccel ? accel : _lastAccel;
			if (
				Math.abs(_lastAccel.x - accel.x) > _delta || 
				Math.abs(_lastAccel.y - accel.y) > _delta ||
				Math.abs(_lastAccel.z - accel.z) > _delta
			) {
				var currentTime = new Date();
				var timeDifference = currentTime.getTime() - _tLastShake.getTime();
				_tLastShake = currentTime;
				
				api.fireEvent('update', {
					source: event.source,
					timestamp: timeDifference,
					type: 'update',
					x: accel.x,
					y: accel.y,
					z: accel.z
				});
			}
			_lastAccel = accel;
		}
	}, false);
	
})(Ti._5.createClass('Titanium.Accelerometer'));