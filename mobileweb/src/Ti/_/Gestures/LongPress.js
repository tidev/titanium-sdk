define("Ti/_/Gesture/LongPress", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.LongPress", null, {
		
		name: "longpress",
		
		blocking: [],
		
		_timer: null,
		_touchStartLocation: null,
		
		// This is the amount of time that must elapse before the tap is considered a long press
		_timeThreshold: 500,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			clearTimeout(this._timer);
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
				this._timer = setTimeout(lang.hitch(this,function(){
					if (!element._isGestureBlocked(this.name)) {
						this.blocking.push("singletap");
						this.blocking.push("doubletap");
						lang.hitch(element,element._handleTouchEvent("longpress",{
							x: e.changedTouches[0].clientX,
							y: e.changedTouches[0].clientY
						}));
					}
				}),this._timeThreshold);
			}
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				clearTimeout(this._timer);
			}
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchMoveEvent: function(e, element){
			if (Math.abs(this._touchStartLocation.x - e.changedTouches[0].clientX) > this._driftThreshold || 
					Math.abs(this._touchStartLocation.y - e.changedTouches[0].clientY) > this._driftThreshold) {
				clearTimeout(this._timer);
			}
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
			clearTimeout(this._timer);
		},
		finalizeTouchCancelEvent: function(){
		}
		
	});
	
});