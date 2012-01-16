define("Ti/_/Gesture/Click", ["Ti/_/declare"], function(declare) {

	return declare("Ti._.Gestures.Click", null, {
		
		processTouchEvent: function(eventType, e){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && eventType === "touchend") {
				console.debug("Click registered");
				return {
					type: "click",
					result: {
						x: e.changedTouches[0].clientX,
						y: e.changedTouches[0].clientY
					}
				}
			}
		}

	});

});