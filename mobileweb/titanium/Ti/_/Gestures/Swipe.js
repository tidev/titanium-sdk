define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

		// This specifies the minimum distance that a finger must travel before it is considered a swipe
	var distanceThreshold = 50,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// This sets the minimum velocity that determines this is a swipe, or just a drag
		velocityThreshold = 0.5;

	return declare("Ti._.Gestures.Swipe", GestureRecognizer, {

		name: "swipe",

		_distanceThresholdPassed: false,

		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._distanceThresholdPassed = false;
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				};
				this._startTime = Date.now();
			} else {
				this._touchStartLocation = null;
			}
		},

		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && this._touchStartLocation) {
				var x = e.changedTouches[0].clientX,
						y = e.changedTouches[0].clientY,
						xDiff = Math.abs(this._touchStartLocation.x - x),
						yDiff = Math.abs(this._touchStartLocation.y - y),
						distance = Math.sqrt(Math.pow(this._touchStartLocation.x - x, 2) + Math.pow(this._touchStartLocation.y - y, 2)),
						angleOK,
						direction,
						velocity;
					!this._distanceThresholdPassed && (this._distanceThresholdPassed = distance > distanceThreshold);
					
					if (this._distanceThresholdPassed) {
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
								this._touchStartLocation.x - x > 0 ? "left" : "right" :
								this._touchStartLocation.y - y < 0 ? "down" : "up";
							velocity = Math.abs(distance / (Date.now() - this._startTime));
							if (velocity > velocityThreshold) {
								lang.hitch(element,element._handleTouchEvent(this.name,{
									x: x,
									y: y,
									direction: direction,
									source: this.getSourceNode(e,element)
								}));
							}
						}
					}
			}
			this._touchStartLocation = null;
		},

		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}
	});
	
});