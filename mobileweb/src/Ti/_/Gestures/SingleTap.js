define("Ti/_/Gesture/SingleTap", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.SingleTap", null, {
		
		name: "singletap",
		
		blocking: [],
		
		_touchStartLocation: null,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
			}
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && this._touchStartLocation) {
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				if (Math.abs(this._touchStartLocation.x - x) < this._driftThreshold && 
						Math.abs(this._touchStartLocation.y - y) < this._driftThreshold) {
					this._touchStartLocation = null;
					var result = {
						x: x,
						y: y
					};
					if (!element._isGestureBlocked(this.name)) {
						lang.hitch(element,element._handleTouchEvent("click",result));
						lang.hitch(element,element._handleTouchEvent(this.name,result));
					}
				}
			}
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
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