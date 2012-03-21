define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	var lastShake = (new Date()).getTime(),
		lastAccel = {},
		threshold = 0.2,
		api = lang.setObject("Ti.Accelerometer", Evented);
	
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
			if (lastAccel.x !== void 0 && (
				Math.abs(lastAccel.x - accel.x) > threshold || 
				Math.abs(lastAccel.y - accel.y) > threshold ||
				Math.abs(lastAccel.z - accel.z) > threshold
			)) {
				currentTime = (new Date()).getTime();
				accel.timestamp = currentTime - lastShake;
				lastShake = currentTime;
				api.fireEvent("update", accel);
			}
			lastAccel = accel;
		}
	});
	
	return api;
	
});