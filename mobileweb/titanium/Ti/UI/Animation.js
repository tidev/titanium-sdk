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
		is = require.is,
		lastTime = 0,
		prefixes = ["ms", "moz", "webkit", "o"],
		i = prefixes.length,
		ignoreRegExp = /autoreverse|curve|delay|duration|repeat|visible/,
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
		var wid,
			elem,
			itemsStillAnimating = 0,
			elementPropsAmimating;

		for (wid in animations) {
			elem = animations[wid];
			for (prop in animations[a]) {
				//
			}
		}

		// TODO: only play animations that are NOT PAUSED

		// TODO: fire complete
		// anim.fireEvent("complete");
		// anim.complete()

		itemsStillAnimating && requestAnimationFrame(render);
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
			right
			top
			width
			zindex

		matrix
			transform
	*/

		/*	id = elem.widgetId + '/' + prop,
			ani = animations[id];

		animations[id] = [
			elem,
			prop,
			value,
			!!props.autoreverse,
			curve,
			props.delay | 0,
			props.duration | 0,
			!!props.repeat,
			!!props.visible,
			this.start,
			this.complete,
			now(),
			ani ? ani[11] : style.get(elem.domNode, prop)
		];
		*/

/*
			var self = this,
				f = function() {
					self._doAnimation(anim, callback);
				};

			UI._layoutInProgress || !self._isAttachedToActiveWin() ? on.once(UI, "postlayout", f) : f();
*/

	api.play = function animationPlay(elem, anim) {
		var promise = new require.Promise,
			wid = elem.widgetId,
			id = Math.random() * 1e9 | 0,
			elemAnis = animations[wid] = (animations[wid] || []),
			i,
			value,
			props = {},
			prop,
			properties = anim.properties.__values__,
			delay = properties.delay | 0,
			visible = !!properties.visible;

		// get all animatable properties that are defined
		for (prop in properties) {
			value = properties[prop];
			if (!ignoreRegExp.test(prop) && value !== void 0) {
				// see if we are already animating this element's property
				for (i = 0; i < elemAnis.length; i++) {
					delete elemAnis[i].props[prop];
					if (require.isEmpty(elemAnis[i].props)) {
						elemAnis.splice(i--, 1);
					}
				}
				props[prop] = [
					/* from */ style.get(elem.domNode, prop),
					/* to */   value
				];
			}
		}

		function go() {
			debugger;

			animations[wid].push({
				id: id,
				elem: elem,
				promise: promise,
				props: props,
				ts: now(),
				autoreverse: !!props.autoreverse,
				curve: Math.max(0, Math.min(curves.length - 1, properties.curve | 0)),
				duration: props.duration | 0,
				repeat: !!props.repeat
			});

			anim.fireEvent("start");
			is(anim.start, "Function") && anim.start()

			needsRender || needsRender = true, requestAnimationFrame(render);
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
			return !!a && (a.paused = true);
		};

		promise.resume = function() {
			var a = findAnimation();
			return !!a && !(a.paused = false);
		};

		return promise.then(function() {
			anim.fireEvent("complete");
			is(anim.complete, "Function") && anim.complete();
			elem.visible = visible;
		});
	};

	return api;

});
