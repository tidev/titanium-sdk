define(["Ti/_/browser", "Ti/_/declare", "Ti/UI/View", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, View, lang, dom, style, UI, event) {

	var setStyle = style.set,
		calculateDistance = dom.calculateDistance,
		on = require.on,
		transitionEvents = {
			webkit: "webkitTransitionEnd",
			trident: "msTransitionEnd",
			gecko: "transitionend",
			presto: "oTransitionEnd"
		},
		transitionEnd = transitionEvents[browser.runtime] || "transitionEnd",

		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		distanceThreshold = 50,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		velocityThreshold = 0.5,

		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		minimumFlickDistanceScaleFactor = 15,

		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		minimumDragDistanceScaleFactor = 2,

		// The default velocity when there isn't enough data to calculate the velocity
		defaultVelocity = 0.5,

		// This is the limit that elastic drags will go towards (i.e. limit as x->infinity = elasticityLimit)
		elasticityLimit = 25,

		// Controls the friction curve for elastic dragging. The higher the value, the sooner drag starts to kick in.
		elasticityDrag = 30,

		transformPostfix = "translateZ(0)";

	// Make sure that translateZ is supported
	(function(){
		var testDiv = dom.create("div", {
			id: "foo",
			position: "absolute"
		}, document.body);
		setTimeout(function(){
			setStyle(testDiv, "transform", transformPostfix);
			!style.get(testDiv, "transform") && (transformPostfix = "");
			dom.detach(testDiv);
		},1);
	})();

	return declare("Ti._.UI.KineticScrollView", View, {

		_initKineticScrollView: function(contentContainer, elasticity){

			var contentContainerDomNode,
				self = this,
				velocity = 0,
				startTranslationX,
				startTranslationY,
				translationX,
				translationY,
				positionData;
			self._currentTranslationX = 0;
			self._currentTranslationY = 0;
			self._horizontalElastic = elasticity === "horizontal" || elasticity === "both";
			self._verticalElastic = elasticity === "vertical" || elasticity === "both";

			// Create the content container
			self._add(self._contentContainer = contentContainer);
			contentContainerDomNode = contentContainer.domNode;

			// Listen for postlayouts and update the translation
			on(self, "postlayout", function() {
				self._minTranslationX = Math.min(0, self._measuredWidth - self._borderLeftWidth - self._borderRightWidth - self._contentContainer._measuredWidth);
				self._minTranslationY = Math.min(0, self._measuredHeight - self._borderTopWidth - self._borderBottomWidth - self._contentContainer._measuredHeight);
			});

			on(self, "draggingstart", function(e) {
				startTranslationX = self._currentTranslationX;
				startTranslationY = self._currentTranslationY;
				positionData = [];
				self._handleDragStart && self._handleDragStart(e);
			});

			on(self, "dragging", function(e) {
				translationX = startTranslationX + e.distanceX;
				translationY = startTranslationY + e.distanceY;
				positionData.push({
					time: (new Date).getTime(),
					translationX: translationX,
					translationY: translationY
				});
				self._setTranslation(translationX, translationY);
				self._handleDrag && self._handleDrag(e);
			});

			on(self, "draggingcancel", function(e) {
				self._animateToPosition(startTranslationX, startTranslationY, 400 + 0.3 * calculateDistance(
						startTranslationX, startTranslationY, self._currentTranslationX, self._currentTranslationY),
					"ease-in-out", function(){
						self._handleDragCancel && self._handleDragCancel(e);
					});
				self._handleDragCancel && self._handleDragCancel(e);
			});

			on(self, "draggingend", function(e) {
				var velocityX = defaultVelocity,
					velocityY = defaultVelocity,
					position1 = self._currentTranslationX,
					position2 = self._currentTranslationY,
					period,
					i = 1,
					len = positionData.length,
					minTranslationX = self._minTranslationX,
					minTranslationY = self._minTranslationY,
					horizontalElastic = self._horizontalElastic,
					verticalElastic = self._verticalElastic,
					springBack;

				// Spring back if need be
				if (position1 > 0) {
					position1 = 0;
					springBack = 1;
				} else if(position1 < minTranslationX) {
					position1 = minTranslationX;
					springBack = 1;
				}
				if (position2 > 0) {
					position2 = 0;
					springBack = 1;
				} else if(position2 < minTranslationY) {
					position2 = minTranslationY;
					springBack = 1;
				}

				if (springBack) {
					self._animateToPosition(position1, position2, 200, "ease-out", function(){
						self._handleDragEnd && self._handleDragEnd(e);
					});
				} else {
					// Calculate the velocity by calculating a weighted slope average, favoring more recent movement
					if (len > 1) {
						for(; i < len; i++) {
							position1 = positionData[i - 1];
							position2 = positionData[i];
							period = position2.time - position1.time;
							velocityX = (velocityX * (i - 1) + i * (position2.translationX - position1.translationX) / period) / 2 / i;
							velocityY = (velocityY * (i - 1) + i * (position2.translationY - position1.translationY) / period) / 2 / i;
						}

						// Output the data for visualization
						/*var data = "";
						for(i = 0; i < len; i++) {
							position1 = positionData[i];
							period = position1.time - positionData[0].time;
							data += period + " " +
								Math.round(position1.translationX - startTranslationX) + " " +
								Math.round(position1.translationY - startTranslationY) + " " +
								Math.round(velocityX * period) + " " +
								Math.round(velocityY * period) + "\n";
						}
						console.log(data);*/

						// Clamp the velocity and call the callback
						self._handleDragEnd && self._handleDragEnd(e, velocityX, velocityY);
					}
				}
			});
		},

		_animateToPosition: function(destinationTranslationX, destinationTranslationY, duration, curve, callback) {
			var self = this,
				contentContainerDomNode = self._contentContainer.domNode;
			if (calculateDistance(self._currentTranslationX, self._currentTranslationY, destinationTranslationX, destinationTranslationY) < 1) {
				self._setTranslation(destinationTranslationX, destinationTranslationY);
				callback();
			} else {
				setStyle(contentContainerDomNode, "transition", "all " + duration + "ms " + curve);
				setTimeout(function(){
					self._setTranslation(destinationTranslationX, destinationTranslationY);
				},1);
				on.once(contentContainerDomNode, transitionEnd, function(){
					setStyle(contentContainerDomNode, "transition", "");
					callback && callback();
				});
			}
		},

		_setTranslation: function(translationX, translationY) {

			// Check if the translation is outside the limits of the view and apply elasticity
			function elastize(value) {
				return elasticityLimit * (-1 / (value / elasticityDrag + 1) + 1);
			}
			var minTranslationX = this._minTranslationX,
				minTranslationY = this._minTranslationY,
				horizontalElastic = this._horizontalElastic,
				verticalElastic = this._verticalElastic;
			if (translationX > 0) {
				translationX = horizontalElastic ? elastize(translationX) : 0;
			} else if(translationX < minTranslationX) {
				translationX = horizontalElastic ? minTranslationX - elastize(minTranslationX - translationX) : minTranslationX;
			}
			if (translationY > 0) {
				translationY = verticalElastic ? elastize(translationY) : 0;
			} else if(translationY < minTranslationY) {
				translationY = verticalElastic ? minTranslationY - elastize(minTranslationY - translationY) : minTranslationY;
			}

			// Apply the translation
			setStyle(this._contentContainer.domNode, "transform", "translate(" + (this._currentTranslationX = translationX) + "px, " +
					(this._currentTranslationY = translationY) + "px)" + transformPostfix);
		}
	});
});