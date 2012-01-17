define("Ti/_/Gesture/GestureRecognizer", ["Ti/_/declare","Ti/_/lang"], function(declare,lang) {

	var on = require.on;

	return declare("Ti._.Gestures.GestureRecognizer", null, {
		
		constructor: function(element) {
			
			this.element = element;
			
			var gestureRecognizers = [
				(new Ti._.Gestures.Touch()),
				(new Ti._.Gestures.Click()),
				(new Ti._.Gestures.SingleTap()),
				(new Ti._.Gestures.DoubleClick()),
				(new Ti._.Gestures.DoubleTap()),
				(new Ti._.Gestures.LongPress()),
				(new Ti._.Gestures.Pinch()),
				(new Ti._.Gestures.Swipe()),
				(new Ti._.Gestures.TwoFingerTap())
			];
			
			function processTouchEvent(eventType,e) {
				for (var i in gestureRecognizers) {
					var recognizerResult = gestureRecognizers[i].processTouchEvent(eventType,e);
					if (recognizerResult) {
						var type = recognizerResult.type;
						for (var i in recognizerResult.results) {
							element._handleTouchEvent(type,recognizerResult.results[i]);
						}
					}
				}
			}
			
			if ("ontouchstart" in document.body) {
				
				// Hook up to the touch events
				on(element.domNode,"touchstart",lang.hitch(this,function(e){
					processTouchEvent("touchstart",e);
				}));
				on(element.domNode,"touchmove",lang.hitch(this,function(e){
					processTouchEvent("touchmove",e);
				}));
				on(element.domNode,"touchend",lang.hitch(this,function(e){
					processTouchEvent("touchend",e);
				}));
				on(element.domNode,"touchcancel",lang.hitch(this,function(e){
					processTouchEvent("touchcancel",e);
				}));
				
			} else {
				
				function touchify(e) {
					return {
						touches: [],
					    targetTouches: [],
					    changedTouches: [e],
					    altKey: e.altKey,
					    metaKey: e.metaKey,
					    ctrlKey: e.ctrlKey,
					    shiftKey: e.shiftKey
					};
				}
				
				// Fall back to using the traditional mouse events
				on(element.domNode,"mousedown",lang.hitch(this,function(e){
					processTouchEvent("touchstart",touchify(e));
				}));
				on(element.domNode,"mousemove",lang.hitch(this,function(e){
					processTouchEvent("touchmove",touchify(e));
				}));
				on(element.domNode,"mouseup",lang.hitch(this,function(e){
					processTouchEvent("touchend",touchify(e));
				}));
				
			}
		}

	});

});