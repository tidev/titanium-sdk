/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	var timer = null,
		touchStartLocation = null,
		
		// This is the amount of time that must elapse before the tap is considered a long press
		timeThreshold = 500,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		driftThreshold = 25;

	return lang.setObject('Ti._.Gestures.LongPress', {
		
		processTouchStartEvent: function (e, elements) {
			var changed = e.changedTouches,
				x = changed[0].clientX,
				y = changed[0].clientY;
			clearTimeout(timer);
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				};
				timer = setTimeout(function () {
					require('Ti/UI')._fireGestureEvents({
						longpress: [{
							x: x,
							y: y
						}]
					}, elements);
				}, timeThreshold);
			}
		},
		
		processTouchEndEvent: function (e) {
			if (e.touches.length === 0 && e.changedTouches.length === 1) {
				clearTimeout(timer);
			}
		},
		
		processTouchMoveEvent: function (e) {
			if (!touchStartLocation || Math.abs(touchStartLocation.x - e.changedTouches[0].clientX) > driftThreshold ||
					Math.abs(touchStartLocation.y - e.changedTouches[0].clientY) > driftThreshold) {
				clearTimeout(timer);
			}
		},
		
		processTouchCancelEvent: function () {
			clearTimeout(timer);
		}
		
	});
	
});