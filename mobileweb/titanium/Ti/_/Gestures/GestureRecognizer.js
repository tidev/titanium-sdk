define(["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.GestureRecognizer", null, {
		
		blocking: null,
		
		constructor: function() {
			this.blocking = [];
		},
		
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
		}

	});

});