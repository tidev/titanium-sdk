define("Ti/_/Gestures/TwoFingerTap", ["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TwoFingerTap", GestureRecognizer, {
		
		name: "twofingertap",
		
		_touchStartLocation: null,
		_touchEndLocation: null,
		_fingerDifferenceThresholdTimer: null,
		
		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		_fingerDifferenceThreshold: 100,
		
		// This is the amount of space the fingers are allowed drift until the gesture is no longer considered a two finger tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			element.backgroundColor == "yellow" && console.debug("Two Finger Tap" + touchesLength + "," + changedTouchesLength);
			
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
				
			// Something else, means it's not a two finger tap
			} else {
				this._touchStartLocation = null;
			}
		},
		
		processTouchEndEvent: function(e, element){
			element.backgroundColor == "yellow" && console.debug("Two Finger Tap end" + e.touches.length + "," + e.changedTouches.length);
			
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			
			// One finger was lifted off, one remains
			if (touchesLength == 1 && changedTouchesLength == 1) {
				this._touchEndLocation = [{
					x: x,
					y: y
				}];
				this._fingerDifferenceThresholdTimer = setTimeout(lang.hitch(this,function(){
					this._touchStartLocation = null;
				}),this._fingerDifferenceThreshold);
				
			// Second or both fingers lifted off
			} else if (touchesLength == 0 && (changedTouchesLength == 1 || changedTouchesLength == 2)) {
				if (this._touchStartLocation && this._touchStartLocation.length == 2) {
					for(var i = 0; i < changedTouchesLength; i++) {
						this._touchEndLocation.push({
							x: x,
							y: y
						});
					}
					var distance1OK = Math.abs(this._touchStartLocation[0].x - this._touchEndLocation[0].x) < this._driftThreshold && 
							Math.abs(this._touchStartLocation[0].y - this._touchEndLocation[0].y) < this._driftThreshold,
						distance2OK = Math.abs(this._touchStartLocation[1].x - this._touchEndLocation[1].x) < this._driftThreshold && 
							Math.abs(this._touchStartLocation[1].y - this._touchEndLocation[1].y) < this._driftThreshold;
					// Check if the end points are swapped from the start points
					if (!distance1OK || !distance2OK) {
						distance1OK = Math.abs(this._touchStartLocation[0].x - this._touchEndLocation[1].x) < this._driftThreshold && 
							Math.abs(this._touchStartLocation[0].y - this._touchEndLocation[1].y) < this._driftThreshold;
						distance2OK = Math.abs(this._touchStartLocation[1].x - this._touchEndLocation[0].x) < this._driftThreshold && 
							Math.abs(this._touchStartLocation[1].y - this._touchEndLocation[0].y) < this._driftThreshold;
					}
					if (distance1OK && distance2OK && !element._isGestureBlocked(this.name)) {
						this.blocking.push("singletap");
						this.blocking.push("doubletap");
						this.blocking.push("longpress");
						lang.hitch(element,element._handleTouchEvent(this.name,{
							x: (this._touchStartLocation[0].x + this._touchStartLocation[1].x) / 2,
							y: (this._touchStartLocation[0].y + this._touchStartLocation[1].y) / 2
						}));
					}
					this._touchStartLocation = null;
				}
				
			// Something else, means it's not a two finger tap
			} else {
				this._touchStartLocation = null;
			}
			
			
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}
		
	});
	
});