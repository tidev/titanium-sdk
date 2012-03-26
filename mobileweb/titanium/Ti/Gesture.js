define(["Ti/_/Evented", "Ti/_/lang", "Ti/UI", "Ti/_/ready"],
	function(Evented, lang, UI, ready) {

	var win = window,
		on = require.on,
		initiallyPortrait = win.orientation !== void 0 ? win.orientation === 0 : null,
		isPortrait = function() {
			var portrait = initiallyPortrait;
			if (portrait !== null) {
				initiallyPortrait = null;
				return portrait;
			}
			return !(win.innerWidth && win.innerWidth > win.innerHeight);
		},
		getOrientation = function() {
			return isPortrait() ? UI.PORTRAIT : UI.LANDSCAPE_LEFT;
		},
		lastOrientation = getOrientation(),
		lastDeviceOrientation,
		lastShake = (new Date()).getTime(),
		lastAccel = {},
		api = lang.setObject("Ti.Gesture", Evented, {
			_updateOrientation: function() {
				var orientation = this.constants.__values__.orientation = getOrientation();
				if (lastOrientation !== orientation) {
					api.fireEvent('orientationchange', {
						orientation: lastOrientation = orientation
					});
					return 1;
				}
			},

			isLandscape: function() {
				return this.landscape;
			},

			isPortrait: function() {
				return this.portrait;
			},

			constants: {
				portrait: function() {
					return isPortrait();
				},
				landscape: function() {
					return !isPortrait();
				},
				orientation: getOrientation()
			}
		});

	function deviceOrientation(evt) {
		var orient,
			beta = Math.abs(evt.beta || evt.y|0 * 90),
			gamma = Math.abs(evt.gamma || evt.x|0 * 90);

		beta < 5 && gamma > 170 && (orient = UI.FACE_DOWN);
		beta < 5 && gamma < 5 && (orient = UI.FACE_UP);
		beta > 50 && 0 > beta && lastDeviceOrientation !== orient && (orient = UI.UPSIDE_PORTRAIT);

		lastDeviceOrientation !== orient && api.fireEvent('orientationchange', {
			orientation: lastDeviceOrientation = orient,
			source: evt.source
		});
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
			if (lastAccel.x !== void 0) {
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