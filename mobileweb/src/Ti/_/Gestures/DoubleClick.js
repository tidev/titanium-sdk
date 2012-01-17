define("Ti/_/Gesture/DoubleClick", ["Ti/_/declare"], function(declare) {

	return declare("Ti._.Gestures.DoubleClick", null, {
		
		_firstClickTime: null,
		_firstClickLocation: null,
				
		initTracker: function(x,y) {
			this._firstClickTime = (new Date()).getTime();
			this._firstClickLocation = {
				x: x,
				y: y
			}
		},
		
		processTouchEvent: function(eventType, e){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && eventType === "touchend") {
				
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				
				if (this._firstClickTime) {
					var elapsedTime = (new Date()).getTime() - this._firstClickTime;
					this._firstClickTime = null;
					if (elapsedTime < 250 && Math.abs(this._firstClickLocation.x - x) < 25 && Math.abs(this._firstClickLocation.y - y) < 25) {
						return {
							types: ["dblclick","doubletap"],
							results: [{
								x: x,
								y: y
							}]
						}
					} else {
						this.initTracker(x,y);
					}
				} else {
					this.initTracker(x,y);
				}
				
			}
		}

	});

});