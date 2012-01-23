define("Ti/Gesture", ["Ti/_/Evented", "Ti/_/lang", "Ti/UI"], function(Evented, lang, UI) {

	var undef,
		win = window,
		on = require.on,
		lastOrient = null,
		lastShake = (new Date()).getTime(),
		lastAccel = {},
		api = lang.setObject("Ti.Gesture", Evented, {
			properties: {
				orientation: UI.UNKNOWN
			}
		});

	function getWindowOrientation() {
		api.orientation = UI.PORTRAIT;
		switch (win.orientation) {
			case 90:
				api.orientation = UI.LANDSCAPE_LEFT;
				break;
			case -90:
				api.orientation = UI.LANDSCAPE_RIGHT;
				break;
			case 180:
				api.orientation = UI.UPSIDE_PORTRAIT;
				break;
		}
		return api.orientation;
	}
	getWindowOrientation();

	on(win, "orientationchange", function(evt) {
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

		beta < 5 && gamma > 170 && (orient = UI.FACE_DOWN);
		beta < 5 && gamma < 5 && (orient = UI.FACE_UP);
		beta > 50 && 0 > beta && lastOrient != orient && (orient = UI.UPSIDE_PORTRAIT);

		if (orient !== null && lastOrient !== orient) {
			api.fireEvent('orientationchange', {
				orientation: lastOrient = orient,
				source: evt.source
			});
		}
	}

	on(win, "MozOrientation", deviceOrientation);
	on(win, "deviceorientation", deviceOrientation);

	on(win, "devicemotion", function(evt) {
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

	return api;

});
