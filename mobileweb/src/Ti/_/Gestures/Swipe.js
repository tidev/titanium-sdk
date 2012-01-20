define("Ti/_/Gestures/Swipe", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.Swipe", null, {
		
		name: "swipe",
		
		blocking: [],
		
		_touchStartLocation: null,
		_distanceThresholdPassed: false,
		
		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		_distanceThreshold: 25,
		
		// The masimum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		_angleThreshold: Math.PI/12, // 15 degrees
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._distanceThresholdPassed = false;
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
			} else {
				this._touchStartLocation = null;
			}
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				this._processSwipeEvent(e,element,true);
			}
			this._touchStartLocation = null;
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._processSwipeEvent(e,element,false);
			}
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		},
		finalizeTouchCancelEvent: function(){
		},
		
		_processSwipeEvent: function(e,element,finishedSwiping) {
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY;
			if (this._touchStartLocation) {
				var xDiff = Math.abs(this._touchStartLocation.x - x),
					yDiff = Math.abs(this._touchStartLocation.y - y),
					distance = Math.sqrt(Math.pow(this._touchStartLocation.x - x,2) + Math.pow(this._touchStartLocation.y - y,2)),
					angleOK;
				!this._distanceThresholdPassed && (this._distanceThresholdPassed = distance > this._distanceThreshold);
				
				if (this._distanceThresholdPassed) {
					// If the distance is small, then the angle is way restrictive, so we ignore it
					if (distance <= this._distanceThreshold || xDiff === 0 || yDiff === 0) {
						angleOK = true;
					} else if (xDiff > yDiff) {
						angleOK = Math.atan(yDiff/xDiff) < this._angleThreshold;
					} else {
						angleOK = Math.atan(xDiff/yDiff) < this._angleThreshold;
					}
					if (!angleOK) {
						this._touchStartLocation = null;
					} else {
						
						if (!element._isGestureBlocked(this.name)) {
							
							// Calculate the direction
							var direction;
							if (xDiff > yDiff) {
								direction =  this._touchStartLocation.x - x > 0 ? "left" : "right";
							} else {
								direction =  this._touchStartLocation.y - y > 0 ? "down" : "up";
							}
							
							// Right now only left and right are supported
							if (direction === "left" || direction === "right") {
								lang.hitch(element,element._handleTouchEvent(this.name,{
									x: x,
									y: y,
									direction: direction,
									_distance: x - this._touchStartLocation.x,
									_finishedSwiping: finishedSwiping
								}));
							}
						}
					}
				}
			}
		}
		
	});
	
});