define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
	var driftThreshold = 25;

	return declare("Ti._.Gestures.SingleTap", GestureRecognizer, {

		name: "singletap",

		constructor: function(type) {
			this._type = type;
		},

		withinThreshold: function(x, y) {
			var start = this._touchStartLocation;
			return start && Math.abs(start.x - x) < driftThreshold && Math.abs(start.y - y) < driftThreshold;
		},

		processTouchStartEvent: function(e, element){
			var changed = e.changedTouches;
			if (e.touches.length == 1 && changed.length == 1) {
				this._touchStartLocation = {
					x: changed[0].clientX,
					y: changed[0].clientY
				}
				this._driftedOutsideThreshold = false;
			}
		},

		processTouchEndEvent: function(e, element){
			var changed = e.changedTouches,
				x,
				y;

			if (e.touches.length == 0 && changed.length == 1) {
				x = changed[0].clientX;
				y = changed[0].clientY;

				if (this.withinThreshold(x, y) && !this._driftedOutsideThreshold) {
					this._touchStartLocation = null;
					element._isGestureBlocked(this.name) || element._handleTouchEvent(this._type, {
						x: x,
						y: y,
						source: this.getSourceNode(e, element)
					});
				}
			}
		},

		processTouchMoveEvent: function(e, element) {
			var changed = e.changedTouches;
			this._driftedOutsideThreshold = changed.length == 1 && !this.withinThreshold(changed[0].clientX, changed[0].clientY);
		},

		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}

	});

});