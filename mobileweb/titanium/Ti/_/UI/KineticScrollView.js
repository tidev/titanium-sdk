define(["Ti/_/browser", "Ti/_/declare", "Ti/UI/View", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, View, lang, dom, style, UI, event) {

	var setStyle = style.set,
		getStyle = style.get,
		is = require.is,
		isDef = lang.isDef,
		unitize = dom.unitize,
		calculateDistance = dom.calculateDistance,
		on = require.on,
		once = on.once,
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

		// Velocity bounds, used to make sure that animations don't become super long or super short
		minVelocity = 0.3,
		maxVelocity = 3,

		// The default velocity when there isn't enough data to calculate the velocity
		defaultVelocity = 0.5

		transformPostfix = "translateZ(0)";

	// Make sure that translateZ is supported
	(function(){
		var testDiv = dom.create("div", {
			id: "foo",
			position: "absolute"
		}, document.body);
		setTimeout(function(){
			setStyle(testDiv, "transform", transformPostfix);
			!getStyle(testDiv, "transform") && (transformPostfix = "");
			dom.detach(testDiv);
		},1);
	})();

	return declare("Ti._.UI.KineticScrollView", View, {
		
		_initKineticScrollView: function(contentContainer){

			var contentContainerDomNode,
				self = this,
				velocity = 0,
				startTranslationX,
				startTranslationY,
				minTranslationX,
				minTranslationY,
				translationX,
				translationY,
				positionData;
			self._currentTranslationX = 0;
			self._currentTranslationY = 0;

			// Create the content container
			self._add(self._contentContainer = contentContainer);
			contentContainerDomNode = contentContainer.domNode;
			self.domNode.style.overflow = "visible";

			// Listen for postlayouts and update the translation
			on(self, "postlayout", self._updateTranslation);

			on(self, "dragstart", function(e) {
				startTranslationX = self._currentTranslationX;
				startTranslationY = self._currentTranslationY;
				minTranslationX = -self._contentContainer._measuredWidth + self._measuredWidth;
				minTranslationY = -self._contentContainer._measuredHeight + self._measuredHeight;
				positionData = [];
				self._handleDragStart && self._handleDragStart(e);
			});

			on(self, "drag", function(e) {
				translationX = -startTranslationX + e.distanceX;
				translationY = -startTranslationY + e.distanceY;
				positionData.push({
					time: (new Date).getTime(),
					translationX: translationX,
					translationY: translationY
				});
				self._setTranslation(Math.min(0,Math.max(translationX, minTranslationX)),
					Math.min(0,Math.max(translationY, minTranslationY)));
				self._handleDrag && self._handleDrag(e);
			});

			on(self, "dragcancel", function(e) {
				self._animateToPosition(startTranslationX, startTranslationY, 400 + 0.3 * calculateDistance(
						startTranslationX, startTranslationY, self._currentTranslationX, self._currentTranslationY), function(){
					self._handleDragCancel && self._handleDragCancel(e);
				});
				self._handleDragCancel && self._handleDragCancel(e);
			});

			on(self, "dragend", function(e) {
				var velocityX = defaultVelocity,
					velocityY = defaultVelocity,
					position1,
					position2,
					period,
					i = 1,
					len = positionData.length;

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
					/*var data = "",
						offsetX = positionData[len - 1].translationX - velocityX * (positionData[len - 1].time - positionData[0].time),
						offsetY = positionData[len - 1].translationY - velocityY * (positionData[len - 1].time - positionData[0].time);
					for(i = 0; i < len; i++) {
						position1 = positionData[i];
						period = position1.time - positionData[0].time;
						data += period + " " +
							Math.round(position1.translationX - startTranslationX) + " " +
							Math.round(position1.translationY - startTranslationY) + " " +
							Math.round(velocityX * period + offsetX) + " " +
							Math.round(velocityY * period + offsetY) + "\n";
					}
					console.log(data);*/

					// Clamp the velocity and call the callback
					self._handleDragEnd && self._handleDragEnd(e, Math.max(minVelocity, Math.min(maxVelocity, Math.abs(velocityX))),
						Math.max(minVelocity, Math.min(maxVelocity, Math.abs(velocityY))));
				}
			});
		},

		_animateToPosition: function(destinationTranslationX, destinationTranslationY, duration, callback) {
			var self = this,
				contentContainerDomNode = self._contentContainer.domNode;
			if (calculateDistance(self._currentTranslationX, self._currentTranslationY, destinationTranslationX, destinationTranslationY) < 1) {
				self._setTranslation(destinationTranslationX, destinationTranslationY);
				callback();
			} else {
				setStyle(contentContainerDomNode, "transition", "all " + duration + "ms ease-in-out");
				setTimeout(function(){
					self._setTranslation(destinationTranslationX, destinationTranslationY);
				},1);
				on.once(contentContainerDomNode, transitionEnd, function(){
					setStyle(contentContainerDomNode, "transition", "");
					callback();
				});
			}
		},

		_setTranslation: function(translationX, translationY) {
			setStyle(this._contentContainer.domNode, "transform", "translate(" + (this._currentTranslationX = translationX) + "px, " +
					(this._currentTranslationY = translationY) + "px)" + transformPostfix);
		}
	});
});