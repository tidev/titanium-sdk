define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.Pinch", GestureRecognizer, {
		
		name: "pinch",
		
		_touchStartLocation: null,
		_fingerDifferenceThresholdTimer: null,
		_startDistance: null,
		_previousDistance: null,
		_previousTime: null,
		
		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		_fingerDifferenceThreshold: 100,
		
		// This is the minimum amount of space the fingers are must move before it is considered a pinch
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			
			// First finger down of the two, given a slight difference in contact time
			if (touchesLength == 1 && changedTouchesLength == 1) {
				this._touchStartLocation = [{
					x: x,
					y: y
				}];
				this._fingerDifferenceThresholdTimer = setTimeout(lang.hitch(this,function(){
					this._touchStartLocation = null;
				}),this._fingerDifferenceThreshold);
			
			// Second finger down of the two, given a slight difference in contact time
			} else if (touchesLength == 2 && changedTouchesLength == 1) {
				clearTimeout(this._fingerDifferenceThresholdTimer);
				if (this._touchStartLocation) {
					this._touchStartLocation.push({
						x: x,
						y: y
					});
					this._startDistance = Math.sqrt(Math.pow(this._touchStartLocation[0].x - this._touchStartLocation[1].x,2) + 
						Math.pow(this._touchStartLocation[0].y - this._touchStartLocation[1].y,2));
				}
				
			// Two fingers down at the same time
			} else if (touchesLength == 2 && changedTouchesLength == 2) {
				this._touchStartLocation = [{
					x: x,
					y: y
				},
				{
					x: e.changedTouches[1].clientX,
					y: e.changedTouches[1].clientY
				}];
				this._startDistance = Math.sqrt(Math.pow(this._touchStartLocation[0].x - this._touchStartLocation[1].x,2) + 
					Math.pow(this._touchStartLocation[0].y - this._touchStartLocation[1].y,2));
				
			// Something else, means it's not a pinch
			} else {
				this._touchStartLocation = null;
			}
		},
		
		processTouchEndEvent: function(e, element){
			this.processTouchMoveEvent(e, element);
			this._touchStartLocation = null;
		},
		
		processTouchMoveEvent: function(e, element){
			if (this._touchStartLocation && this._touchStartLocation.length == 2 && e.touches.length == 2) {
				var currentDistance = Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX,2) + 
					Math.pow(e.touches[0].clientY - e.touches[1].clientY,2)),
					velocity = 0,
					currentTime = Date.now();
				if (this._previousDistance) {
					velocity = Math.abs(this._previousDistance / this._startDistance - currentDistance / this._startDistance) / ((currentTime - this._previousTime) / 1000); 
				}
				this._previousDistance = currentDistance;
				this._previousTime = currentTime;
				if (!element._isGestureBlocked(this.name)) {
					element._handleTouchEvent(this.name,{
						scale: currentDistance / this._startDistance,
						velocity: velocity,
						source: this.getSourceNode(e,element)
					});
				}
			}
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}
		
	});
	
});