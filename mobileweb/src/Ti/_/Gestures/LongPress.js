define("Ti/_/Gesture/LongPress", ["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.LongPress", null, {
		
		name: "longpress",
		
		blocking: [],
		
		_ended: false,
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				this._ended = false;
				setTimeout(lang.hitch(this,function(){
					if (!this._ended) {
						if (!element._isGestureBlocked(this.name)) {
							this.blocking.push("singletap");
							this.blocking.push("doubletap");
							lang.hitch(element,element._handleTouchEvent("longpress",{
								x: e.changedTouches[0].clientX,
								y: e.changedTouches[0].clientY
							}));
						}
					}
				}),1250);
			}
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				this._ended = true;
			}
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchMoveEvent: function(e, element){
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
			this._ended = true;
		},
		finalizeTouchCancelEvent: function(){
		}
		
	});
	
});