define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.Drag", GestureRecognizer, {

		name: "drag",

		_touchStartLocation: null,

		_cancelDrag: function(e, element) {
			if (this._touchStartLocation) {
				this._touchStartLocation = null;
				!element._isGestureBlocked(this.name) && lang.hitch(element,element._handleTouchEvent("dragcancel",{
					source: this.getSourceNode(e,element)
				}));
			}
		},

		_createEvent: function(e, element) {
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				distanceX = x - this._touchStartLocation.x,
				distanceY = y - this._touchStartLocation.y;
			return {
				x: x,
				y: y,
				distanceX: distanceX,
				distanceY: distanceY,
				distance: Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)),
				source: this.getSourceNode(e,element)
			};
		},

		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
				this._driftedOutsideThreshold = false;
				!element._isGestureBlocked(this.name) && lang.hitch(element,element._handleTouchEvent("dragstart",this._createEvent(e, element)));
			} else if (this._touchStartLocation) {
				this._cancelDrag(e, element);
			}
		},

		processTouchEndEvent: function(e, element){
			if (this._touchStartLocation) {
				if (e.touches.length == 0 && e.changedTouches.length == 1) {
					!element._isGestureBlocked(this.name) && lang.hitch(element,element._handleTouchEvent("dragend",this._createEvent(e, element)));
					this._touchStartLocation = null;
				} else {
					this._cancelDrag(e, element);
				}
			}
		},

		processTouchMoveEvent: function(e, element) {
			if (this._touchStartLocation) {
				if (e.touches.length == 1 && e.changedTouches.length == 1) {
					!element._isGestureBlocked(this.name) && lang.hitch(element,element._handleTouchEvent("drag",this._createEvent(e, element)));
				} else {
					this._cancelDrag(e, element);
				}
			}
		},

		processTouchCancelEvent: function(e, element){
			this._touchStartLocation && this._cancelDrag(e, element);
		}

	});

});