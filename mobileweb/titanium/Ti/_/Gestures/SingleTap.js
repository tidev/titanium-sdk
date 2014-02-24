/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
	var driftThreshold = 25,
		touchStartLocation,
		driftedOutsideThreshold;

	function withinThreshold(x, y) {
		return touchStartLocation && Math.abs(touchStartLocation.x - x) < driftThreshold &&
			Math.abs(touchStartLocation.y - y) < driftThreshold;
	}

	return lang.setObject('Ti._.Gestures.SingleTap', {

		processTouchStartEvent: function (e) {
			var changed = e.changedTouches;
			if (e.touches.length == 1 && changed.length == 1) {
				touchStartLocation = {
					x: changed[0].clientX,
					y: changed[0].clientY
				};
				driftedOutsideThreshold = false;
			}
		},

		processTouchEndEvent: function (e) {
			var changed = e.changedTouches,
				x = changed[0].clientX,
				y = changed[0].clientY,
				events = {
					singletap: [],
					click: []
				};

			if (e.touches.length === 0 && changed.length === 1 && withinThreshold(x, y) && !driftedOutsideThreshold) {
				// We don't reuse the same results object because the values are modified before the event is fired.
				// If we reused the object, they would be modified twice, which is incorrect.
				events.singletap.push({
					x: x,
					y: y
				});
				events.click.push({
					x: x,
					y: y
				});
				touchStartLocation = null;
			}
			return events;
		},

		processTouchMoveEvent: function (e) {
			var changed = e.changedTouches;
			driftedOutsideThreshold = changed.length == 1 && !withinThreshold(changed[0].clientX, changed[0].clientY);
		},

		processTouchCancelEvent: function () {
			touchStartLocation = null;
		}

	});

});