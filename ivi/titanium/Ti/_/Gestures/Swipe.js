/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

		// This specifies the minimum distance that a finger must travel before it is considered a swipe
	var distanceThreshold = 50,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// This sets the minimum velocity that determines this is a swipe, or just a drag
		velocityThreshold = 0.5,

		distanceThresholdPassed = false,
		touchStartLocation,
		startTime;

	return lang.setObject('Ti._.Gestures.Swipe', {

		processTouchStartEvent: function(e){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				distanceThresholdPassed = false;
				touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				};
				startTime = Date.now();
			} else {
				touchStartLocation = null;
			}
		},

		processTouchEndEvent: function(e){
			if (e.touches.length === 0 && e.changedTouches.length === 1 && touchStartLocation) {
				var x = e.changedTouches[0].clientX,
						y = e.changedTouches[0].clientY,
						xDiff = Math.abs(touchStartLocation.x - x),
						yDiff = Math.abs(touchStartLocation.y - y),
						distance = Math.sqrt(Math.pow(touchStartLocation.x - x, 2) + Math.pow(touchStartLocation.y - y, 2)),
						angleOK,
						direction,
						velocity;
					!distanceThresholdPassed && (distanceThresholdPassed = distance > distanceThreshold);

					if (distanceThresholdPassed) {
						// If the distance is small, then the angle is way restrictive, so we ignore it
						if (distance <= distanceThreshold || xDiff === 0 || yDiff === 0) {
							angleOK = true;
						} else if (xDiff > yDiff) {
							angleOK = Math.atan(yDiff/xDiff) < angleThreshold;
						} else {
							angleOK = Math.atan(xDiff/yDiff) < angleThreshold;
						}
						if (angleOK) {

							// Calculate the direction
							direction = xDiff > yDiff ?
								touchStartLocation.x - x > 0 ? 'left' : 'right' :
								touchStartLocation.y - y < 0 ? 'down' : 'up';
							velocity = Math.abs(distance / (Date.now() - startTime));
							if (velocity > velocityThreshold) {
								return {
									swipe: [{
										x: x,
										y: y,
										direction: direction
									}]
								};
							}
						}
					}
			}
			touchStartLocation = null;
		},

		processTouchCancelEvent: function(){
			touchStartLocation = null;
		}
	});
	
});