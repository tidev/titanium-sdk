define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/style"], function(declare, Evented, style) {

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
		global = window,
		lastTime = 0,
		prefixes = ["ms", "moz", "webkit", "o"],
		i = prefixes.length,
		ignoreRegExp = /autoreverse|curve|delay|duration|repeat|visible/,
		needsRender,
		animations = {},
		colors = require(require.config.colorsModule);

	function now() {
		return (new Date).getTime();
	}

	while (--i >= 0 && !global.requestAnimationFrame) {
		global.requestAnimationFrame = global[prefixes[i] + "RequestAnimationFrame"];
	}

	global.requestAnimationFrame || (global.requestAnimationFrame = function(callback) {
		var currTime = now(),
			timeToCall = Math.max(0, 16 - (currTime - lastTime)),
			timer = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
		lastTime = currTime + timeToCall;
		return timer;
	});

	function render(ts) {
		var a,
			prop,
			itemsStillAnimating = 0,
			elementPropsAmimating;

		for (a in animations) {
			for (prop in animations[a]) {
				//params[9]
			}
		}

		itemsStillAnimating && requestAnimationFrame(render);
	}

	/*
	params array spec
		0	element
		1	property name
		2	destination value
		3	autoreverse
		4	curve array index
		5	delay
		6	duration
		7	repeat flag
		8	visible flag
	---------------------------
		9	start timestamp
		10	start value
		11	current value
		12	unit

	units
		color
			backgroundColor
			color

		number		none, px, em, dip, in, mm, cm, pt, %
			bottom
			center[x,y]
			height
			left
			right
			top
			width
			zindex

		matrix
			transform
	*/

	function schedule(elem, prop, value, params) {
		var a,
			currentValue = style.get(elem.domNode, prop);

		if (currentValue !== void 0) {
			animations[elem.widgetId + '/' + prop] = a = [elem, prop, value];

			a.push(now());
			a.push(currentValue);
			a.push(currentValue);

			// TODO: determine units
			params.push("px");

			// TODO: fire start

			// needsRender || needsRender = true, requestAnimationFrame(render);
		}
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
				curve = Math.max(0, Math.min(curves.length - 1, props.curve | 0)),
				handles = [];

			for (prop in props) {
				value = props[prop];
				ignoreRegExp.test(prop) || value !== void 0 && handles.push(schedule(elem, prop, value, [!!props.autoreverse, curve, props.delay | 0, props.duration | 0, !!props.repeat, !!props.visible]));
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
