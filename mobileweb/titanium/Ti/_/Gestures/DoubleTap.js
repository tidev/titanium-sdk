define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.DoubleTap", GestureRecognizer, {
		
		name: "doubletap",
		
		_firstTapTime: null,
		_firstTapLocation: null,
		
		// This is the amount of time that can elapse before the two taps are considered two separate single taps
		_timeThreshold: 250,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
				
		initTracker: function(x,y) {
			this._firstTapTime = (new Date()).getTime();
			this._firstTapLocation = {
				x: x,
				y: y
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				
				if (this._firstTapTime) {
					var elapsedTime = (new Date()).getTime() - this._firstTapTime;
					this._firstTapTime = null;
					if (elapsedTime < this._timeThreshold && Math.abs(this._firstTapLocation.x - x) < this._driftThreshold && 
							Math.abs(this._firstTapLocation.y - y) < this._driftThreshold) {
						var result = {
							x: x,
							y: y
						};
						if (!element._isGestureBlocked(this.name)) {
							this.blocking.push("singletap");
							lang.hitch(element,element._handleTouchEvent("dblclick",result));
							lang.hitch(element,element._handleTouchEvent(this.name,result));
						}
					} else {
						this.initTracker(x,y);
					}
				} else {
					this.initTracker(x,y);
				}
				
			}
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchCancelEvent: function(e, element){
			this._firstTapTime = null;
		}

	});

});