define("Ti/_/Gesture/Swipe", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.Swipe", null, {
		
		name: "swipe",
		
		blocking: [],
		
		_touchStartLocation: null,
		_distanceThresholdPassed: false,
		
		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		_distanceThreshold: 25,
		
		// The masimum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		_angleThreshold: Math.PI/12, // 15 degrees
		
		_isAngleOK: function(x,y) {
			var xDiff = Math.abs(this._touchStartLocation.x - x),
				yDiff = Math.abs(this._touchStartLocation.y - y);
				
			// If the distance is small, then the angle is way restrictive, so we ignore it
			if (Math.sqrt(Math.pow(this._touchStartLocation.x - x,2) + 
					Math.pow(this._touchStartLocation.y - y,2)) <= this._distanceThreshold) {
				return true;
			}
				
			if (xDiff === 0 || yDiff === 0) {
				return true;
			} else if (xDiff > yDiff) {
				return Math.atan(yDiff/xDiff) < this._angleThreshold;
			} else {
				return Math.atan(xDiff/yDiff) < this._angleThreshold;
			}
		},
		
		_getDirection: function(x,y) {
			var xDiff = Math.abs(this._touchStartLocation.x - x),
				yDiff = Math.abs(this._touchStartLocation.y - y);
			if (xDiff > yDiff) {
				return this._touchStartLocation.x - x > 0 ? "left" : "right";
			} else {
				return this._touchStartLocation.y - y > 0 ? "down" : "up";
			}
		},
		
		_isDistanceOK: function(x,y) {
			
			!this._distanceThresholdPassed && (this._distanceThresholdPassed = (Math.sqrt(Math.pow(this._touchStartLocation.x - x,2) + 
				Math.pow(this._touchStartLocation.y - y,2)) > this._distanceThreshold));
			
			return this._distanceThresholdPassed;
		},
		
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
			this.processTouchMoveEvent(e, element);
			this._touchStartLocation = null;
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				if (this._touchStartLocation) {
					if (!this._isAngleOK(x,y)) {
						this._touchStartLocation = null;
					} else {
						if (!element._isGestureBlocked(this.name) && this._isDistanceOK(x,y)) {
							var direction = this._getDirection(x,y);
							// Right now only left and right are supported
							if (direction === "left" || direction === "right") {
								lang.hitch(element,element._handleTouchEvent(this.name,{
									x: x,
									y: y,
									direction: direction
								}));
							}
						}
					}
				}
			}
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		},
		finalizeTouchCancelEvent: function(){
		}
		
	});
	
});