(function(api){
	var undef,
		on = require.on,
		lastOrient = null,
		lastShake = (new Date()).getTime(),
		lastAccel = {};

	// Interfaces
	Ti._5.EventDriven(api);

	Ti._5.prop(api, "orientation", Ti.UI.UNKNOWN);

	function getWindowOrientation() {
		api.orientation = Ti.UI.PORTRAIT;
		switch (window.orientation) {
			case 90:
				api.orientation = Ti.UI.LANDSCAPE_LEFT;
				break;
			case -90:
				api.orientation = Ti.UI.LANDSCAPE_RIGHT;
				break;
			case 180:
				api.orientation = Ti.UI.UPSIDE_PORTRAIT;
				break;
		}
		return api.orientation;
	}
	getWindowOrientation();

	on(window, "orientationchange", function(evt) {
		getWindowOrientation();
		lastOrient !== api.orientation && api.fireEvent('orientationchange', {
			orientation: lastOrient = api.orientation,
			source: evt.source
		});
	});

	function deviceOrientation(evt) {
		var orient = null,
			beta = Math.abs(evt.beta || evt.y|0 * 90),
			gamma = Math.abs(evt.gamma || evt.x|0 * 90);

		beta < 5 && gamma > 170 && (orient = Ti.UI.FACE_DOWN);
		beta < 5 && gamma < 5 && (orient = Ti.UI.FACE_UP);
		beta > 50 && 0 > beta && lastOrient != orient && (orient = Ti.UI.UPSIDE_PORTRAIT);

		if (orient !== null && lastOrient !== orient) {
			api.fireEvent('orientationchange', {
				orientation: lastOrient = orient,
				source: evt.source
			});
		}
	}

	on(window, "MozOrientation", deviceOrientation);
	on(window, "deviceorientation", deviceOrientation);

	on(window, "devicemotion", function(evt) {
		var e = evt.acceleration || evt.accelerationIncludingGravity,
			x, y, z,
			currentTime,
			accel = e && {
				x: e.x,
				y: e.y,
				z: e.z,
				source: evt.source
			};

		if (accel) {
			if (lastAccel.x !== undef) {
				x = Math.abs(lastAccel.x - accel.x) > 10;
				y = Math.abs(lastAccel.y - accel.y) > 10;
				z = Math.abs(lastAccel.z - accel.z) > 10;
				if ((x && (y || z)) || (y && z)) {
					currentTime = (new Date()).getTime();
					if ((accel.timestamp = currentTime - lastShake) > 300) {
						lastShake = currentTime;
						api.fireEvent('shake', accel);
					}
				}
			}
			lastAccel = accel;
		}
	});

})(Ti._5.createClass('Ti.Gesture'));