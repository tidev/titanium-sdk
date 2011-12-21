define("Ti/Analytics", ["Ti/_/Evented"], function(Evented) {
	
	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		var undef,
			lastShake = (new Date()).getTime(),
			lastAccel = {};
	
		require.on(window, "devicemotion", function(evt) {
			var e = evt.acceleration || evt.accelerationIncludingGravity,
				currentTime,
				accel = e && {
					x: e.x,
					y: e.y,
					z: e.z,
					source: evt.source
				};
			if (accel) {
				if (lastAccel.x !== undef && (
					Math.abs(lastAccel.x - accel.x) > 0.2 || 
					Math.abs(lastAccel.y - accel.y) > 0.2 ||
					Math.abs(lastAccel.z - accel.z) > 0.2
				)) {
					currentTime = (new Date()).getTime();
					accel.timestamp = currentTime - lastShake;
					lastShake = currentTime;
					api.fireEvent("update", accel);
				}
				lastAccel = accel;
			}
		});
	
	})(Ti._5.createClass("Ti.Accelerometer"));
	
});