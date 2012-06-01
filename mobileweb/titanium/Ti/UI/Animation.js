define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	var curves = [
			function easeInOut(n) {
				n *= 2;
				return n < 1 ? Math.pow(n, 2) / 2 : -1 * ((--n) * (n - 2) - 1) / 2;
			},
			function easeIn(n) {
				return Math.pow(n, 2);
			},
			function easeOut(n) {
				return n * (n - 2) * -1;
			},
			function linear(n) {
				return n;
			}
		],
		animations = [],
		ignoreRegExp = /autoreverse|curve|delay|duration|repeat|visible/;


(function() {
	var lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'];

	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime(),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());



	function schedule(element, prop, value, autoreverse, curve, delay, duration, repeat, visible) {
		// check if we're already animating this property on this element
	}

	// http://developer.appcelerator.com/question/137700/mobileweb-tableviewrow-and-tableviewsection-tostring-changed

	// animator
	// - animates all scheduled animations
	// - fires start/complete events
		// question: what is fired first? start() or start event
		// anim.start()
		// anim.fireEvent("start");
		// anim.complete()
		// anim.fireEvent("complete");

/*
			var self = this,
				f = function() {
					self._doAnimation(anim, callback);
				};

			UI._layoutInProgress || !self._isAttachedToActiveWin() ? on.once(UI, "postlayout", f) : f();
*/

	return declare("Ti.UI.Animation", Evented, {

		_play: function(elem) {
			var prop,
				value,
				props = this.properties.__values__,
				curve = curves[props.curve | 0] || curves[0],
				handles = [];

			for (prop in props) {
				value = props[prop];
				ignoreRegExp.test(prop) || value !== void 0 && handles.push(schedule(elem, prop, value, !!props.autoreverse, curve, props.delay | 0, props.duration | 0, !!props.repeat, !!props.visible));
			}

 			return {
				pause: function() {
					// use the handles to unschedule
				}
			};
		},

		properties: {
			autoreverse: void 0,
			backgroundColor: void 0,
			bottom: void 0,
			center: void 0,
			color: void 0,
			curve: void 0,
			delay: void 0,
			duration: void 0,
			height: void 0,
			left: void 0,
			opacity: void 0,
			repeat: void 0,
			right: void 0,
			top: void 0,
			transform: void 0,
			visible: void 0,
			width: void 0,
			zIndex: void 0
		}

	});

});
