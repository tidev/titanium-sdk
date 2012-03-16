define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	var undef,
		lastShake = (new Date()).getTime(),
		lastAccel = {};
		api = lang.setObject("Ti.Accelerometer", Evented, {});
	
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
	
});