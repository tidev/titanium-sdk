define("Ti/_/Gesture/Touch", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.Touch", null, {
		
		name: "Touch",
		
		blocking: [],
		
		processTouchStartEvent: function(e, element){
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
		},
		finalizeTouchCancelEvent: function(){
		},
		processTouchEvent: function(eventType, e, element){
			for (var i in e.changedTouches) {
				lang.hitch(element,element._handleTouchEvent(eventType,{
					x: e.changedTouches[i].clientX,
					y: e.changedTouches[i].clientY
				}));
			}
		}

	});

});