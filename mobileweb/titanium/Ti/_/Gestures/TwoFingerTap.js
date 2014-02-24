/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	var touchStartLocation = null,
		touchEndLocation = null,
		fingerDifferenceThresholdTimer = null,

		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		fingerDifferenceThreshold = 100,

		// This is the amount of space the fingers are allowed drift until the gesture is no longer considered a two finger tap
		driftThreshold = 25;

	return lang.setObject('Ti._.Gestures.TwoFingerTap', {

		processTouchStartEvent: function(e){

			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;

			// First finger down of the two, given a slight difference in contact time
			if (touchesLength == 1 && changedTouchesLength == 1) {
				touchStartLocation = [{
					x: x,
					y: y
				}];
				fingerDifferenceThresholdTimer = setTimeout(function () {
					touchStartLocation = null;
					touchEndLocation = null;
				},fingerDifferenceThreshold);

			// Second finger down of the two, given a slight difference in contact time
			} else if (touchesLength == 2 && changedTouchesLength == 1) {
				clearTimeout(fingerDifferenceThresholdTimer);
				touchStartLocation && touchStartLocation.push({
					x: x,
					y: y
				});

			// Two fingers down at the same time
			} else if (touchesLength == 2 && changedTouchesLength == 2) {
				touchStartLocation = [{
						x: x,
						y: y
					},
					{
						x: e.changedTouches[1].clientX,
						y: e.changedTouches[1].clientY
					}];
			// Something else, means it's not a two finger tap
			} else {
				touchStartLocation = null;
				touchEndLocation = null;
			}
		},

		processTouchEndEvent: function(e){

			var changedTouches = e.changedTouches,
				x = changedTouches[0].clientX,
				y = changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = changedTouches.length,
				events = {},
				i,
				distance1OK,
				distance2OK;

			// One finger was lifted off, one remains
			if (touchesLength == 1 && changedTouchesLength == 1) {
				touchEndLocation = [{
					x: x,
					y: y
				}];
				fingerDifferenceThresholdTimer = setTimeout(function () {
					touchStartLocation = null;
					touchEndLocation = null;
				}, fingerDifferenceThreshold);

			// Second or both fingers lifted off
			} else if (touchesLength === 0 && (changedTouchesLength === 1 || changedTouchesLength === 2)) {
				if (touchStartLocation && touchStartLocation.length === 2) {
					touchEndLocation || (touchEndLocation = []);
					for(i = 0; i < changedTouchesLength; i++) {
						touchEndLocation.push({
							x: changedTouches[i].clientX,
							y: changedTouches[i].clientY
						});
					}
					if (touchEndLocation.length === 2) {
						distance1OK = Math.abs(touchStartLocation[0].x - touchEndLocation[0].x) < driftThreshold &&
							Math.abs(touchStartLocation[0].y - touchEndLocation[0].y) < driftThreshold;
						distance2OK = Math.abs(touchStartLocation[1].x - touchEndLocation[1].x) < driftThreshold &&
							Math.abs(touchStartLocation[1].y - touchEndLocation[1].y) < driftThreshold;
						// Check if the end points are swapped from the start points
						if (!distance1OK || !distance2OK) {
							distance1OK = Math.abs(touchStartLocation[0].x - touchEndLocation[1].x) < driftThreshold &&
								Math.abs(touchStartLocation[0].y - touchEndLocation[1].y) < driftThreshold;
							distance2OK = Math.abs(touchStartLocation[1].x - touchEndLocation[0].x) < driftThreshold &&
								Math.abs(touchStartLocation[1].y - touchEndLocation[0].y) < driftThreshold;
						}
						if (distance1OK && distance2OK) {
							events.twofingertap = [{
								x: (touchStartLocation[0].x + touchStartLocation[1].x) / 2,
								y: (touchStartLocation[0].y + touchStartLocation[1].y) / 2
							}];
						}
					}
					touchStartLocation = null;
					touchEndLocation = null;
					return events;
				}

			// Something else, means it's not a two finger tap
			} else {
				touchStartLocation = null;
				touchEndLocation = null;
			}
		},

		processTouchCancelEvent: function(){
			touchStartLocation = null;
			touchEndLocation = null;
		}

	});

});