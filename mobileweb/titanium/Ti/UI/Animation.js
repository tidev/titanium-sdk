define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/style", "Ti/UI"], function(declare, Evented, style, UI) {

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
		now = Date.now,
		is = require.is,
		on = require.on,
		lastTime = 0,
		prefixes = ["ms", "moz", "webkit", "o"],
		i = prefixes.length,
		ignoreOptions = {
			autoreverse: 1,
			bottom: 1,
			center: 1,
			curve: 1,
			delay: 1,
			duration: 1,
			repeat: 1,
			right: 1,
			visible: 1,
			zIndex: 1
		},
		colorOptions = {
			backgroundColor: 1,
			color: 1
		},
		positionOptions = {
			height: 1,
			left: 1,
			opacity: 1,
			top: 1,
			width: 1
		},
		unitRegExp = /(\d+)(.*)/,
		needsRender,
		animations = {},
		colors = require(require.config.ti.colorsModule),
		api = declare("Ti.UI.Animation", Evented, {
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

	function pump() {
		UI._layoutInProgress ? on.once(UI, "postlayout", function() {
			requestAnimationFrame(render)
		}) : requestAnimationFrame(render);
	}

	function render(ts) {
		var wid,
			anis,
			ani,
			elem,
			i,
			from,
			to,
			pct,
			val,
			vals;

		needsRender = 0;

		for (wid in animations) {
			for (anis = animations[wid], i = 0; i < anis.length; i++) {
				ani = anis[i];
				if (!ani.paused) {
					pct = ani.duration ? Math.min(1, (ts - ani.ts) / ani.duration) : 1;
					elem = ani.elem;

					if (elem._isAttachedToActiveWin()) {
						for (prop in ani.props) {
							vals = ani.props[prop];
							from = vals[0];
							to = vals[1];

							if (colorOptions[prop]) {
								//

							} else if (positionOptions[prop]) {
								if (pct === 1) {
									val = to;
								} else {
									val = ((to - from) * curves[ani.curve](pct)) + from;
									needsRender = 1;
								}

console.log("animating " + prop + " from " + from + " to " + to + " val = " + val + " " + (pct*100) + "% done [" + ts + "]");

								elem.domNode.style[prop] = val + "px";
							}
						}
					}

					if (pct === 1) {
						ani.promise.resolve();
						anis.splice(i--, 1);
						if (!anis.length) {
							delete animations[wid];
						}
					}
				}
			}
		}

		needsRender && pump();
	}

	/*
	units
		color
			backgroundColor
			color

		number		none, px, em, dip, in, mm, cm, pt, %
			bottom
			center[x,y]
			height
			left
			opacity
			right
			top
			width

		matrix
			transform
	*/

	api._play = function animationPlay(elem, anim) {
		var promise = new require.Promise,
			wid = elem.widgetId,
			id = Math.random() * 1e9 | 0,
			elemAnis = animations[wid] = (animations[wid] || []),
			properties = anim.properties.__values__,
			delay = properties.delay | 0,
			visible = !!properties.visible;

		function go() {
			var i,
				value,
				props = {},
				prop,
				from,
				to = elem._parent._layout.calculateAnimation(elem, anim);

			// get all animatable properties that are defined
			for (prop in properties) {
				value = properties[prop];
				if (!ignoreOptions[prop] && value !== void 0) {
					// see if we are already animating this element's property
					for (i = 0; i < elemAnis.length; i++) {
						delete elemAnis[i].props[prop];
						if (require.isEmpty(elemAnis[i].props)) {
							elemAnis.splice(i--, 1);
						}
					}
					from = style.get(elem.domNode, prop);
					if (!(prop in to) || (from = parseFloat(from)) !== to) {
						props[prop] = [
							/* from */ from,
							/* to */   prop in to ? to[prop] : value
						];
					}
				}
			}

			animations[wid].push({
				id: id,
				elem: elem,
				promise: promise,
				props: props,
				ts: now(),
				autoreverse: !!properties.autoreverse,
				curve: Math.max(0, Math.min(curves.length - 1, properties.curve | 0)),
				duration: properties.duration | 0,
				repeat: !!properties.repeat
			});

			anim.fireEvent("start");
			is(anim.start, "Function") && anim.start()

			if (!needsRender) {
				needsRender = 1;
				pump();
			}
		}

		delay ? setTimeout(go, delay) : go();

		function findAnimation() {
			var elemAnis = animations[wid],
				i = 0,
				len = elemAnis && elemAnis.length;
			while (i < len) {
				if (elemAnis[i].id === id) {
					return elemAnis[i];
				}
			}
		}

		promise.pause = function() {
			var a = findAnimation();
			return !!a && (a.paused = now());
		};

		promise.resume = function() {
			var a = findAnimation(),
				prop;
				//elem._parent._layout.calculateAnimation(elem, anim)

			a.paused && (a.ts += (now() - a.paused));

			for (prop in a.props) {
				//
			}

			if (!needsRender) {
				needsRender = 1;
				pump();
			}

			return !!a && !(a.paused = 0);
		};

		return promise.then(function() {
			properties.visible !== void 0 && (elem.visible = visible);
			properties.zIndex !== void 0 && (elem.zIndex = zIndex);
			anim.fireEvent("complete");
			is(anim.complete, "Function") && anim.complete();
		});
	};

	return api;

});
