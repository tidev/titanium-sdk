/*global define*/
define(['Ti/_/declare', 'Ti/_/lang'], function (declare, lang) {

	// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
	var driftThreshold =  25,
		touchStartLocation;

	function cancelDrag(e) {
		var cancelEvent;
		if (touchStartLocation) {
			cancelEvent = createEvent(e);
			touchStartLocation = null;
			return {
				draggingcancel: cancelEvent
			};
		}
	}

	function createEvent (e) {
		var x = e.changedTouches[0].clientX,
			y = e.changedTouches[0].clientY,
			distanceX = x - touchStartLocation.x,
			distanceY = y - touchStartLocation.y;
		return [{
			x: x,
			y: y,
			distanceX: distanceX,
			distanceY: distanceY,
			distance: Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))
		}];
	}

	return lang.setObject('Ti._.Gestures.Drag', {

		processTouchStartEvent: function(e){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				var x,
					y;
				touchStartLocation = {
					x: x = e.changedTouches[0].clientX,
					y: y = e.changedTouches[0].clientY
				};
				return {
					draggingstart: createEvent(e)
				};
			} else if (touchStartLocation) {
				return cancelDrag(e);
			}
		},

		processTouchEndEvent: function(e){
			if (touchStartLocation) {
				var distance = Math.sqrt(Math.pow(e.changedTouches[0].clientX - touchStartLocation.x, 2) +
						Math.pow(e.changedTouches[0].clientY - touchStartLocation.y, 2)),
					endEvent;
				if (e.touches.length === 0 && e.changedTouches.length === 1 && distance > driftThreshold) {
					endEvent = createEvent(e);
					touchStartLocation = null;
					return {
						draggingend: endEvent
					};
				} else {
					return cancelDrag(e);
				}
			}
		},

		processTouchMoveEvent: function(e) {
			if (touchStartLocation) {
				if (e.touches.length == 1 && e.changedTouches.length == 1) {
					return {
						dragging: createEvent(e)
					};
				} else {
					return cancelDrag(e);
				}
			}
		},

		processTouchCancelEvent: function(e){
			return touchStartLocation && cancelDrag(e);
		}

	});

});