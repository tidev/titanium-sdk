define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TouchMove", GestureRecognizer, {
		
		name: "touchmove",
		
		processTouchMoveEvent: function(e, element){
			if (!element._isGestureBlocked(this.name)) {
				var changed = e.changedTouches,
					i = 0,
					l = changed.length,
					src = this.getSourceNode(e, element);
				for (; i < l; i++) {
					element._handleTouchEvent(this.name, {
						x: changed[i].clientX,
						y: changed[i].clientY,
						source: src
					});
				}
			}
		}

	});

});