/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	var touchStartLocation = null,
		fingerDifferenceThresholdTimer = null,
		startDistance = null,
		previousDistance = null,
		previousTime = null,

		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		fingerDifferenceThreshold = 100;

	function processTouch(e) {
		if (touchStartLocation && touchStartLocation.length == 2 && e.touches.length == 2) {
			var currentDistance = Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX,2) +
				Math.pow(e.touches[0].clientY - e.touches[1].clientY,2)),
				velocity = 0,
				currentTime = Date.now();
			if (previousDistance) {
				velocity = Math.abs(previousDistance / startDistance - currentDistance / startDistance) / ((currentTime - previousTime) / 1000);
			}
			previousDistance = currentDistance;
			previousTime = currentTime;
			return {
				pinch: [{
					scale: currentDistance / startDistance,
					velocity: velocity
				}]
			};
		}
	}

	return lang.setObject('Ti._.Gestures.Pinch', {

		processTouchStartEvent: function (e) {
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
				}, fingerDifferenceThreshold);

			// Second finger down of the two, given a slight difference in contact time
			} else if (touchesLength == 2 && changedTouchesLength == 1) {
				clearTimeout(fingerDifferenceThresholdTimer);
				if (touchStartLocation) {
					touchStartLocation.push({
						x: x,
						y: y
					});
					startDistance = Math.sqrt(Math.pow(touchStartLocation[0].x - touchStartLocation[1].x,2) +
						Math.pow(touchStartLocation[0].y - touchStartLocation[1].y,2));
				}

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
				startDistance = Math.sqrt(Math.pow(touchStartLocation[0].x - touchStartLocation[1].x,2) +
					Math.pow(touchStartLocation[0].y - touchStartLocation[1].y,2));
				
			// Something else, means it's not a pinch
			} else {
				touchStartLocation = null;
			}
		},

		processTouchEndEvent: function(e){
			var result = processTouch(e);
			touchStartLocation = null;
			return result;
		},

		processTouchMoveEvent: function(e){
			return processTouch(e);
		},

		processTouchCancelEvent: function () {
			touchStartLocation = null;
		}

	});
	
});