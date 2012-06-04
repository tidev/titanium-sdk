define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.SingleTap", GestureRecognizer, {
		
		name: "singletap",
		
		_touchStartLocation: null,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
				this._driftedOutsideThreshold = false;
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && this._touchStartLocation) {
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				if (Math.abs(this._touchStartLocation.x - x) < this._driftThreshold && 
						Math.abs(this._touchStartLocation.y - y) < this._driftThreshold && !this._driftedOutsideThreshold) {
					this._touchStartLocation = null;
					var source = this.getSourceNode(e,element);
					// We don't reuse the same results object because the values are modified before the event is fired.
					// If we reused the object, they would be modified twice, which is incorrect.
					if (!element._isGestureBlocked(this.name)) {
						lang.hitch(element,element._handleTouchEvent("click", {
							x: x,
							y: y,
							source: source
						}));
						lang.hitch(element,element._handleTouchEvent(this.name, {
							x: x,
							y: y,
							source: source
						}));
					}
				}
			}
		},
		
		processTouchMoveEvent: function(e, element) {
			if (Math.abs(this._touchStartLocation.x - e.changedTouches[0].clientX) > this._driftThreshold || 
					Math.abs(this._touchStartLocation.y - e.changedTouches[0].clientY) > this._driftThreshold) {
				this._driftedOutsideThreshold = true;
			}
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}

	});

});