/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	var firstTapTime = null,
		firstTapLocation = null,
		
		// This is the amount of time that can elapse before the two taps are considered two separate single taps
		timeThreshold = 250,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		driftThreshold = 25;

	function initTracker (x, y) {
		firstTapTime = Date.now();
		firstTapLocation = {
			x: x,
			y: y
		};
	}

	return lang.setObject('Ti._.Gestures.DoubleTap', {

		processTouchEndEvent: function(e){
			if (e.touches.length === 0 && e.changedTouches.length === 1) {
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY,
					events = {
						doubletap: [],
						dblclick: []
					},
					elapsedTime = Date.now() - firstTapTime;

				if (firstTapTime) {
					firstTapTime = null;
					if (elapsedTime < timeThreshold && Math.abs(firstTapLocation.x - x) < driftThreshold &&
						Math.abs(firstTapLocation.y - y) < driftThreshold) {
						// We don't reuse the same results object because the values are modified before the event is fired.
						// If we reused the object, they would be modified twice, which is incorrect.
						events.doubletap.push({
							x: x,
							y: y
						});
						events.dblclick.push({
							x: x,
							y: y
						});
						return events;
					} else {
						initTracker(x,y);
					}
				} else {
					initTracker(x,y);
				}
			}
		},

		processTouchCancelEvent: function(){
			this._firstTapTime = null;
		}

	});

});