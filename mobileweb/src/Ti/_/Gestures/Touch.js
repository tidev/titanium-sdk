define("Ti/_/Gesture/Touch", ["Ti/_/declare"], function(declare) {

	return declare("Ti._.Gestures.Touch", null, {
		
		processTouchEvent: function(eventType, e){
			var results = [];
			for (var i in e.changedTouches) {
				results.push({
					x: e.changedTouches[i].clientX,
					y: e.changedTouches[i].clientY
				});
			}
			return {
				types: [eventType],
				results: results
			}
		}

	});

});