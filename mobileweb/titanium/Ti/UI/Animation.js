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
		rgbaRegExp = /^rgba?\(([\s\.,0-9]+)\)/,
		threeDRegExp = /3d/,
		tiMatrixRegExp = /^Ti\.UI\.(2|3)DMatrix$/,
		matrixRegExp = /matrix(3d)?\(([^\)]*)/,
		rotateRegExp = /rotate(3d)?\(([^\)]*)/,
		needsRender,
		animations = {},
		transformName = style.discover("transform"),
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
			j,
			len,
			from,
			to,
			pct,
			progress,
			val,
			vals;

		needsRender = 0;

		for (wid in animations) {
			for (anis = animations[wid], i = 0; i < anis.length; i++) {
				ani = anis[i];
				if (!ani.paused) {
					pct = ani.duration ? Math.min(1, (ts - ani.ts) / ani.duration) : 1;
					progress = curves[ani.curve](ani.forward ? pct : 1 - pct);
					elem = ani.elem;

					if (elem._isAttachedToActiveWin()) {
						for (prop in ani.props) {
							vals = ani.props[prop];
							from = vals[0];
							to = vals[1];

							pct === 1 && (val = ani.forward ? to : from);

							if (prop === "transform") {
								if (pct !== 1) {
									val = [];
									len = from.length;
									for (j = 0; j < len; j++) {
										// for 3d matrices, indices 12-14 are normally [0, 0, 0, 1], but since they are
										// unused, we use them to store the rotation vector which we want to skip
										if (j < 12 || j > 14) {
											val[j] = from[j] + ((to[j] - from[j]) * progress);
										}
									}
									needsRender = 1;
								}

								if (val.length === 16) {
									j = val.splice(12);
									val = "matrix3d(" + val.join(',') + ") rotate3d(" + j.join(',') + "deg)";
								} else {
									j = val.pop();
									val = "matrix(" + val.join(',') + ") rotate(" + j + "deg)";
								}

								prop = transformName;

							} else if (colorOptions[prop]) {
								if (pct !== 1) {
									val = [];
									for (j = 0; j < 4; j++) {
										val[j] = Math.floor(from[j] + ((to[j] - from[j]) * progress));
									}
									needsRender = 1;
								}
								val = "rgba(" + val.join(',') + ")";

							} else if (positionOptions[prop]) {
								if (pct !== 1) {
									val = from + ((to - from) * progress);
									needsRender = 1;
								}
								val = prop === "opacity" ? val : val + "px";
							}

							ani.prev !== val && (elem.domNode.style[prop] = val);
							ani.prev = val;
						}
					}

					if (pct === 1) {
						ani.ts = ts;
						if (ani.duration && ani.reverse && ani.forward) {
							ani.forward = 0;
							needsRender = 1;
						} else if (ani.repeat-- > 0) {
							needsRender = ani.forward = 1;
						} else {
							// we need to remove this animation before resolving
							anis.splice(i--, 1);
							ani.promise.resolve();
							if (!anis.length) {
								delete animations[wid];
							}
						}
					}
				}
			}
		}

		needsRender && pump();
	}

	function parseColor(color) {
		var i, bits, mask, result;

		color = color.trim().toLowerCase();

		if (color.charAt(0) === '#') {
			// hex
			bits = color.length == 4 ? 4 : 8;
			if (!isNaN(color = Number("0x" + color.substring(1)))) {
				mask = (1 << bits) - 1; // 15 or 255
				result = bits === 4 ? 17 : 1; // multiplier
				result = [((color >> bits * 2) & mask) * result, ((color >> bits) & mask) * result, (color & mask) * result, 1];
			}
		} else if (i = color.match(rgbaRegExp)) {
			// rgb, rbga
			result = i[1].split(/\s*,\s*/);
			for (i = 0; i < 3;) {
				result[i++] |= 0;
			}
		} else if (colors) {
			// named color
			result = colors[color];
		}

		if (result) {
			result[3] = isNaN(i = parseFloat(result[3])) ? 1 : Math.min(Math.max(i, 0), 1);
			return result;
		}
	}

	function parse3dMatrix(matrix, rotate, to, toType) {
		// this function parses an existing 2d or 3d tranform into a 3d matrix

		var is3d,
			params,
			len,
			i,
			from = [1, 0, 0, 0,
			        0, 1, 0, 0,
			        0, 0, 1, 0,
			        0, 0, 0, 0]; // m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, rx, ry, rz, r

		if (matrix) {
			is3d = matrix[1];
			params = matrix[2].split(',');
			len = params.length;

			if (is3d && len === 16) {
				for (i = 0; i < 12; i++) {
					from[i] = params[i];
				}
			} else if (!is3d && len === 6) {
				from[0] = params[0];
				from[1] = params[1];
				from[4] = params[2];
				from[5] = params[3];
				from[3] = params[4];
				from[7] = params[5];
			}
		}

		if (rotate) {
			is3d = rotate[1];
			params = rotate[2].split(',');
			len = params.length;

			if (is3d && len === 4) {
				for (i = 0; i < 4; i++) {
					from[12 + i] = params[i];
				}
			} else if (!is3d && len === 1) {
				from[14] = 1;
				from[15] = params[0];
			}
		}

		if (toType === 2) {
			// promote 2dmatrix "to" into a 3D array
			to = [to.a, to.b, 0, to.tx,
			      to.c, to.d, 0, to.ty,
			      0, 0, 1, 0,
			      0, 0, 1, to.rotation]; // m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, rx, ry, rz, r
		} else {
			// translate "to" into a 3D array
			to = [to.m11, to.m12, to.m13, to.m14,
			      to.m21, to.m22, to.m23, to.m24,
			      to.m31, to.m32, to.m33, to.m34,
			      to.rotationX, to.rotationY, to.rotationZ, to.rotation];
		}

		return [from, to];
	}

	api._play = function animationPlay(elem, anim) {
		var promise = new require.Promise,
			wid = elem.widgetId,
			id = Math.random() * 1e9 | 0,
			anis = animations[wid] = (animations[wid] || []),
			properties = anim.properties.__values__,
			delay = properties.delay | 0,
			visible = !!properties.visible;

		function go() {
			var i,
				len,
				props = {},
				prop,
				from,
				toType,
				to,
				tmp,
				params,
				matrix,
				rotate,
				layoutTo = elem._parent._layout.calculateAnimation(elem, anim);

			// get all animatable properties that are defined
			for (prop in properties) {
				to = properties[prop];
				if (!ignoreOptions[prop] && to !== void 0) {
					// see if we are already animating this element's property
					for (i = 0; i < anis.length; i++) {
						delete anis[i].props[prop];
						if (require.isEmpty(anis[i].props)) {
							anis.splice(i--, 1);
						}
					}

					from = style.get(elem.domNode, prop);

					if (colorOptions[prop]) {
						from = parseColor(from);
						to = parseColor(to);
						(from < to || to < from) && (props[prop] = [from, to]);
					} else if (positionOptions[prop]) {
						isNaN(from = parseFloat(from)) && prop === "opacity" && (from = 1);
						to = prop in layoutTo ? layoutTo[prop] : to;
						from !== to && (props[prop] = [from, to]);
					} else if (prop === "transform" && (toType = to.declaredClass.match(tiMatrixRegExp))) {
						toType = toType[1] | 0;

						matrix = from.match(matrixRegExp);
						rotate = from.match(rotateRegExp);

						if (threeDRegExp.test(from) || toType === 3) {
							tmp = parse3dMatrix(matrix, rotate, to, toType);
							from = tmp[0];
							to = tmp[1];
						} else if (toType === 2) {
							// parse "from" into 2D matrix
							from = [1, 0, 0, 1, 0, 0, 0]; // a, b, c, d, tx, ty, r

							if (matrix) {
								params = matrix[2].split(',');
								len = Math.min(6, params.length);
								for (i = 0; i < len; i++) {
									from[i] = parseFloat(params[i]);
								}
							}

							if (rotate) {
								params = rotate[2].split(',');
								params.length && (from[6] = parseFloat(params[0]));
							}

							// translate "to" into a 2D array
							to = [to.a, to.b, to.c, to.d, to.tx, to.ty, to.rotation];
							tmp = [from, to];
						}

						(from < to || to < from) && (props[prop] = tmp);
					}
				}
			}

			animations[wid].push({
				id: id,
				elem: elem,
				promise: promise,
				props: props,
				ts: now(),
				reverse: !!properties.autoreverse,
				forward: 1,
				curve: Math.max(0, Math.min(curves.length - 1, properties.curve | 0)),
				duration: properties.duration | 0,
				repeat: !!properties.repeat
			});

			anim.fireEvent("start");

			if (!needsRender) {
				needsRender = 1;
				pump();
			}
		}

		delay ? setTimeout(go, delay) : go();

		function findAnimation() {
			var anis = animations[wid],
				i = 0,
				len = anis && anis.length;
			for (; i < len; i++) {
				if (anis[i].id === id) {
					return anis[i];
				}
			}
		}

		promise.source = elem;

		promise.animation = anim;

		promise.pause = function() {
			var a = findAnimation();
			a = !!a && (a.paused || (a.paused = now()));
			anim.fireEvent("pause");
			return a;
		};

		promise.resume = function() {
			var a = findAnimation();

			if (a) {
				a.paused && (a.ts += (now() - a.paused));

				/*
				TODO: if the layout changes while an animation is paused,
				then we need to recalculate the layout prior to resuming.

				elem._parent._layout.calculateAnimation(elem, anim)
				for (prop in a.props) {
					//
				}
				*/

				if (!needsRender) {
					needsRender = 1;
					pump();
				}
			}

			a = !!a && !(a.paused = 0);

			anim.fireEvent("resume");

			return a;
		};

		promise.cancel = function(reset) {
			var anis = animations[wid],
				ani,
				prop,
				node,
				i = 0,
				j = anis && anis.length,
				result = false;

			for (; i < j; i++) {
				if (anis[i].id === id) {
					ani = anis[i];

					if (reset) {
						node = ani.elem.domNode;
						for (prop in ani.props) {
							j = ani.props[prop][0];
							style.set(node, prop, positionOptions[prop] && prop !== "opacity" ? j + "px" : j);
						}
					}

					anis.splice(i, 1);
					if (!anis.length) {
						delete animations[wid];
					}

					result = true;

					break;
				}
			}

			anim.fireEvent("cancel");

			return result;
		};

		return promise.then(function() {
			properties.visible !== void 0 && (elem.visible = visible);
			properties.zIndex !== void 0 && (elem.zIndex = zIndex);

			// TODO: update View.rect here: TIMOB-8930

			anim.fireEvent("complete");
		});
	};

	return api;

});
