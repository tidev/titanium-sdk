define(["Ti/_/Evented", "Ti/_/lang", "Ti/UI", "Ti/_/ready", "Ti/_/event"], function(Evented, lang, UI, ready, event) {

	var win = window,
		on = require.on,
		lastOrient = null,
		lastShake = Date.now(),
		lastAccel = {},
		orientationListeners = 0,
		orientationEvents = [],
		api = lang.setObject("Ti.Gesture", Evented, {
			_updateOrientation: function() {
				getWindowOrientation();
				lastOrient !== api.orientation && api.fireEvent('orientationchange', {
					orientation: lastOrient = api.orientation
				});
			},

			addEventListener: function (name) {
				name == 'orientationchange' && orientationListeners++;
				orientationListeners == 1 && (orientationEvents = [
					on(win, "MozOrientation", deviceOrientation),
					on(win, "deviceorientation", deviceOrientation)
				]);
				Evented.addEventListener.apply(this, arguments);
			},

			removeEventListener: function (name) {
				name == 'orientationchange' && (orientationListeners = Math.max(orientationListeners - 1, 0));
				orientationListeners == 0 && event.off(orientationEvents);
				Evented.removeEventListener.apply(this, arguments);
			},

			isLandscape: function() {
				return api.landscape;
			},

			isPortrait: function() {
				return api.portrait;
			},

			constants: {
				portrait: false,
				landscape: false,
				orientation: UI.UNKNOWN
			}
		});

	function getWindowOrientation() {
		var landscape = !!(window.innerWidth && (window.innerWidth > window.innerHeight)),
			c = api.__values__.constants;
		c.orientation = landscape ? UI.LANDSCAPE_LEFT : UI.PORTRAIT;
		c.landscape = landscape;
		c.portrait = !landscape;
		return api.orientation;
	}

	ready(function() {
		getWindowOrientation();
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
					currentTime = Date.now();
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