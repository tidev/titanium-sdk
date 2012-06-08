define(["Ti/_/browser", "Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, Widget, lang, dom, style, UI, event) {

	var setStyle = style.set,
		getStyle = style.get,
		is = require.is,
		isDef = lang.isDef,
		unitize = dom.unitize,
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

		// Velocity bounds, used to make sure that animations don't become super long or super short
		minVelocity = 0.3,
		maxVelocity = 3,

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

	return declare("Ti.UI.ScrollableView", Widget, {

		constructor: function(args){

			var contentContainer,
				contentContainerDomNode,
				self = this,
				views = self.properties.__values__.views = [],
				velocity = 0,
				sourcePosition,
				minTranslation,
				positionData;
			self._currentTranslation = 0;

			// Create the content container
			self._add(contentContainer = self._contentContainer = UI.createView({
				left: 0,
				top: 0,
				width: UI.SIZE,
				height: "100%",
				layout: "constrainingHorizontal"
			}));
			contentContainerDomNode = contentContainer.domNode;
			self.domNode.style.overflow = "visible";

			// Create the paging control container
			self._add(self._pagingControlContainer = UI.createView({
				width: "100%",
				height: 20,
				bottom: 0,
				backgroundColor: "black",
				opacity: 0,
				touchEnabled: false
			}));

			self._pagingControlContainer._add(self._pagingControlContentContainer = UI.createView({
				width: UI.SIZE,
				height: "100%",
				top: 0,
				touchEnabled: false,
				layout: "constrainingHorizontal"
			}));

			// State variables
			self._viewToRemoveAfterScroll = -1;

			// Listen for postlayouts and update the translation
			on(self, "postlayout", lang.hitch(self, self._updateTranslation));

			on(self, "dragstart", function(e) {
				if (~self.currentPage) {
					var currentPage = self.currentPage;
					sourcePosition = views[currentPage]._measuredLeft;
					minTranslation = -self._contentContainer._measuredWidth + views[views.length - 1]._measuredWidth;
					positionData = [];
					self._showView(currentPage - 1);
					self._showView(currentPage + 1);
				}
			});

			on(self, "drag", function(e) {
				if (~self.currentPage) {
					var position = -sourcePosition + e.distanceX;
					positionData.push({
						time: (new Date).getTime(),
						position: position
					});
					self._setTranslation(Math.min(0,Math.max(position, minTranslation)));
				}
			});

			on(self, "dragcancel", function(e) {
				var translation = -views[self.currentPage]._measuredLeft,
					currentPage = self.currentPage;
				if (Math.abs(self._currentTranslation - translation) < 10) {
					self._setTranslation(translation);
					self._hideView(currentPage - 1);
					self._hideView(currentPage + 1);
				} else {
					setStyle(contentContainerDomNode, "transition", "all " + (400 + 0.3 * contentContainer._measuredWidth) + "ms ease-in-out");
					setTimeout(function(){
						self._setTranslation(translation);
					},1);
					on.once(contentContainerDomNode, transitionEnd, function(){
						setStyle(contentContainerDomNode, "transition", "");
						self._hideView(currentPage - 1);
						self._hideView(currentPage + 1);
					});
				}
			});

			on(self, "dragend", function(e) {
				if (~self.currentPage) {
					var distance = e.distanceX,
						velocity = (positionData[1].position - positionData[0].position) / (positionData[1].time - positionData[0].time),
						currentPage = self.currentPage,
						destinationIndex = currentPage,
						destination = views[destinationIndex],
						destinationPosition,
						duration,
						normalizedWidth,
						i = 1,
						len = positionData.length,
						curve = "ease-out";

					// Calculate the velocity by calculating a weighted slope average, favoring more recent movement
					for(; i < len - 1; i++) {
						velocity = (velocity * i + (i * (positionData[i + 1].position - positionData[i].position) / (positionData[i + 1].time - positionData[i].time))) / (2 * i);
					}
					velocity = Math.abs(velocity);
					velocity < minVelocity && (curve = "ease-in-out");
					velocity = Math.max(minVelocity, Math.min(maxVelocity, velocity));

					// Determine the animation characteristics
					normalizedWidth = views[currentPage]._measuredWidth / (velocity > velocityThreshold ? 
						minimumFlickDistanceScaleFactor :
						minimumDragDistanceScaleFactor);
					if (distance > normalizedWidth && currentPage > 0) {
						// Previous page
						destinationIndex = self.currentPage - 1;
						distance = (destination = views[destinationIndex])._measuredLeft - sourcePosition - distance;
					} else if (distance < -normalizedWidth && currentPage < views.length - 1) {
						// Next page
						destinationIndex = currentPage + 1;
						distance = sourcePosition + distance - (destination = views[destinationIndex])._measuredLeft;
					}
					destinationPosition = destination._measuredLeft;

					// Animate the view
					self._updatePagingControl(destinationIndex);
					duration = 1.724 * Math.abs(distance) / velocity;
					setStyle(contentContainerDomNode, "transition", "all " + duration + "ms " + curve);
					setTimeout(function(){
						self._setTranslation(-destinationPosition);
					},1);
					on.once(contentContainerDomNode, transitionEnd, function(){
						setStyle(contentContainerDomNode, "transition", "");
						destinationIndex !== currentPage - 1 && self._hideView(currentPage - 1);
						destinationIndex !== currentPage && self._hideView(currentPage);
						destinationIndex !== currentPage + 1 && self._hideView(currentPage + 1);
						self.properties.__values__.currentPage = destinationIndex;
						setTimeout(function(){
							self.fireEvent("scroll",{
								currentPage: destinationIndex,
								view: destination
							});
						}, 1);
					});
				}
			});
		},

		_hideView: function(index) {
			var views = this.views;
			index >= 0 && index < views.length && setStyle(views[index].domNode, "display", "none");
		},

		_showView: function(index) {
			var views = this.views;
			index >= 0 && index < views.length && setStyle(views[index].domNode, "display", "inherit");
		},

		addView: function(view){
			if (view) {
				this.views.push(view);
				this._contentContainer._add(view);
				if (this.views.length == 1) {
					this.properties.__values__.currentPage = 0;
				} else {
					setStyle(view.domNode, "display", "none");
				}
			}
		},

		removeView: function(view) {

			// Get and validate the location of the view
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view);
			if (viewIndex < 0 || viewIndex >= this.views.length) {
				return;
			}

			// Update the view if this view was currently visible
			if (viewIndex == this.currentPage && this.views.length !== 1) {
				this._viewToRemoveAfterScroll = viewIndex;
				this.scrollToView(viewIndex == this.views.length - 1 ? --viewIndex : ++viewIndex);
			} else {
				this._removeViewFromList(viewIndex);
			}
		},

		_removeViewFromList: function(viewIndex) {

			var contentContainer = this._contentContainer,
				self = this;

			// Update the current view if necessary once everything has been re-laid out.
			if (viewIndex < this.currentPage) {
				self.properties.__values__.currentPage--;
				on.once(contentContainer, "postlayout", lang.hitch(this, this._updateTranslation));
			}

			// Remove the view and update the paging control
			contentContainer._remove(self.views.splice(viewIndex,1)[0]);
			self._updatePagingControl(self.currentPage);
		},

		_updateTranslation: function() {
			~this.currentPage && this._setTranslation(-this.views[this.currentPage]._measuredLeft);
		},

		_setTranslation: function(distance) {
			setStyle(this._contentContainer.domNode, "transform", "translate(" + (this._currentTranslation = distance) + "px, 0)" + transformPostfix);
		},

		scrollToView: function(view) {
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view),
				self = this;
			
			// Sanity check
			if (viewIndex < 0 || viewIndex >= this.views.length || viewIndex == this.currentPage) {
				return;
			}

			function scroll(){

				// Calculate the views to be scrolled
				var contentContainer = self._contentContainer,
					destinationPosition = self.views[viewIndex]._measuredLeft,
					currentPage = self.currentPage,
					i;

					// Calculate a weighted duration so that larger views take longer to scroll.
					duration = 400 + 0.3 * (Math.abs(viewIndex - self.currentPage) * contentContainer._measuredWidth);

				// Make the views that will be seen visible
				if (currentPage < viewIndex) {
					for(i = currentPage + 1; i <= viewIndex; i++) {
						self._showView(i);
					}
				} else {
					for(i = viewIndex; i < currentPage; i++) {
						self._showView(i);
					}
				}

				// Animate the views
				self._updatePagingControl(viewIndex);
				setStyle(contentContainer.domNode, "transition", "all " + duration + "ms ease-in-out");
				setTimeout(function(){
					self._setTranslation(-destinationPosition);
				},1);
				on.once(contentContainer.domNode, transitionEnd, function(){
					self.properties.__values__.currentPage = viewIndex;
					setStyle(contentContainer.domNode, "transition", "");
					setTimeout(function(){
						if (currentPage < viewIndex) {
							for(i = currentPage; i < viewIndex; i++) {
								self._hideView(i);
							}
						} else {
							for(i = viewIndex + 1; i <= currentPage; i++) {
								self._hideView(i);
							}
						}
						if (self._viewToRemoveAfterScroll !== -1) {
							self._updateTranslation(-destinationPosition + self.views[self._viewToRemoveAfterScroll]._measuredWidth);
							self._removeViewFromList(self._viewToRemoveAfterScroll);
							self._viewToRemoveAfterScroll = -1;
						}
						self.fireEvent("scroll",{
							currentPage: viewIndex,
							view: self.views[viewIndex]
						});
					}, 1);
				});
			}

			// If the scrollableView hasn't been laid out yet, we must wait until it is
			if (self._contentContainer.domNode.offsetWidth) {
				scroll();
			} else {
				on.once("postlayout", scroll);
			}
		},

		_showPagingControl: function() {
			if (!this.showPagingControl) {
				this._pagingControlContainer.opacity = 0;
				return;
			}
			if (this._isPagingControlActive) {
				return;
			}
			this._isPagingControlActive = true;
			this._pagingControlContainer.animate({
				duration: 250,
				opacity: 0.75
			});
			this.pagingControlTimeout > 0 && setTimeout(lang.hitch(this,function() {
				this._pagingControlContainer.animate({
					duration: 750,
					opacity: 0
				});
				this._isPagingControlActive = false;
			}),this.pagingControlTimeout);
		},

		_updatePagingControl: function(newIndex, hidePagingControl) {
			if (this.showPagingControl) {
				this._pagingControlContentContainer._removeAllChildren();
				var diameter = this.pagingControlHeight / 2;
				for (var i = 0; i < this.views.length; i++) {
					var indicator = UI.createView({
						width: diameter,
						height: diameter,
						left: 5,
						right: 5,
						backgroundColor: i === newIndex ? "white" : "grey",
						borderRadius: unitize(diameter / 2)
					});
					this._pagingControlContentContainer._add(indicator);
				}
				!hidePagingControl && this._showPagingControl();
			}
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		properties: {
			clipViews: {
				
			},
			currentPage: {
				set: function(value, oldValue) {
					if (value >= 0 && value < this.views.length) {
						this.scrollToView(value);
						return value;
					}
					return oldValue;
				}
			},
			pagingControlColor: {
				set: function(value) {
					this._pagingControlContainer.backgroundColor = value;
					return value;
				},
				value: "black"
			},
			pagingControlHeight: {
				set: function(value) {
					this._pagingControlContainer.height = value;
					return value;
				},
				value: 20
			},
			pagingControlTimeout: {
				set: function(value) {
					this.pagingControlTimeout == 0 && this._updatePagingControl();
					return value;
				},
				value: 1250
			},
			showPagingControl: {
				set: function(value) {
					this.pagingControlTimeout == 0 && this._updatePagingControl();
					return value;
				},
				value: false
			},
			views: {
				set: function(value) {

					// Value must be an array
					if (!is(value,"Array")) {
						return;
					}

					// Add the views to the content container
					var i = 0,
						len = value.length,
						contentContainer = this._contentContainer,
						view;
					contentContainer._removeAllChildren();
					for(; i < len; i++) {
						(view = value[i]).width = "100%";
						view.height = "100%";
						contentContainer._add(view);
					}

					return value;
				},
				post: function() {
					this._updatePagingControl(this.currentPage,true);
				}
			}
		}

	});

});