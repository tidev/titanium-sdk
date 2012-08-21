define(["Ti/_/browser", "Ti/_/declare", "Ti/_/UI/KineticScrollView", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(browser, declare, KineticScrollView, lang, dom, style, UI, event) {

	var setStyle = style.set,
		is = require.is,
		isDef = lang.isDef,
		unitize = dom.unitize,
		once = require.on.once,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// Velocity bounds, used to make sure that animations don't become super long or super short
		minVelocity = 0.4,
		maxVelocity = 3,

		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		velocityThreshold = 0.4,

		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		minimumFlickDistanceScaleFactor = 200,

		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		minimumDragDistanceScaleFactor = 2;

	return declare("Ti.UI.ScrollableView", KineticScrollView, {

		constructor: function(args){

			// Create the content container
			this._initKineticScrollView(UI.createView({
				left: 0,
				top: 0,
				width: UI.SIZE,
				height: "100%",
				layout: "constrainingHorizontal"
			}), "horizontal");

			// Create the paging control container
			this._add(this._pagingControlContainer = UI.createView({
				width: "100%",
				height: 20,
				bottom: 0,
				backgroundColor: "black",
				opacity: 0,
				touchEnabled: false
			}));

			this._pagingControlContainer._add(this._pagingControlContentContainer = UI.createView({
				width: UI.SIZE,
				height: "100%",
				top: 0,
				touchEnabled: false,
				layout: "constrainingHorizontal"
			}));

			// State variables
			this.properties.__values__.views = [];
			this._viewToRemoveAfterScroll = -1;

			require.on(this, "postlayout", this._updateTranslation);
		},

		_handleDragStart: function() {
			var currentPage = this.currentPage;
			if (~currentPage) {
				this._showView(currentPage - 1);
				this._showView(currentPage);
				this._showView(currentPage + 1);
				this.fireEvent("dragStart");
			}
		},

		_handleDrag: function(e) {
			var currentPage = this.currentPage,
				currentView = this.views[currentPage];
			if (currentView) {
				this.fireEvent("scroll", {
					currentPage: currentPage,
					currentPageAsFloat: currentPage - e.distanceX / currentView._measuredWidth,
					view: currentView
				});
			}
		},

		_handleDragCancel: function() {
			var currentPage = this.currentPage;
			if (~currentPage) {
				this._hideView(currentPage - 1);
				this._showView(currentPage);
				this._hideView(currentPage + 1);
			}
		},

		_handleDragEnd: function(e, velocityX) {
			if (~this.currentPage && isDef(velocityX)) {
				velocityX = Math.max(minVelocity, Math.min(maxVelocity, velocityX));
				var self = this,
					views = self.views,
					contentContainer = self._contentContainer,
					currentPage = self.currentPage,
					distance = e.distanceX,
					normalizedWidth = views[currentPage]._measuredWidth / (Math.abs(velocityX) > velocityThreshold ? 
						minimumFlickDistanceScaleFactor :
						minimumDragDistanceScaleFactor),
					destinationPosition,
					destination = views[currentPage],
					destinationIndex = currentPage;

				// Determine the animation characteristics
				if (distance > normalizedWidth && currentPage > 0) {
					// Previous page
					destinationIndex = currentPage - 1;
					distance = (destination = views[destinationIndex])._measuredLeft - self._currentTranslationX;
				} else if (distance < -normalizedWidth && currentPage < views.length - 1) {
					// Next page
					destinationIndex = currentPage + 1;
					distance = self._currentTranslationX - (destination = views[destinationIndex])._measuredLeft;
				}
				destinationPosition = -destination._measuredLeft;

				// Fire the drag end event
				self.fireEvent("dragEnd", {
					currentPage: destinationIndex,
					view: destination
				});

				// Animate the view. Note: the 1.724 constance was calculated, not estimated. It is NOT for tweaking.
				// If tweaking is needed, tweak the velocity algorithm in KineticScrollView.
				self._animateToPosition(destinationPosition, 0, Math.abs(1.724 * 
						(destinationPosition - self._currentTranslationX) / velocityX), UI.ANIMATION_CURVE_EASE_OUT, function(){
					destinationIndex !== currentPage - 1 && self._hideView(currentPage - 1);
					destinationIndex !== currentPage && self._hideView(currentPage);
					destinationIndex !== currentPage + 1 && self._hideView(currentPage + 1);
					self.properties.__values__.currentPage = destinationIndex;
					self._showView(destinationIndex);
					setTimeout(function(){
						self.fireEvent("scrollEnd",{
							currentPage: destinationIndex,
							view: destination
						});
					}, 1);
				});
			}
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
			}

			// Remove the view and update the paging control
			contentContainer._remove(self.views.splice(viewIndex,1)[0]);
			!self.views.length && (self.properties.__values__.currentPage = -1);
			once(UI, "postlayout", function() {
				setTimeout(function(){
					self._updateTranslation();
				}, 1);
			});
			self._updatePagingControl(self.currentPage);
		},

		_updateTranslation: function() {
			~this.currentPage && this._setTranslation(-this.views[this.currentPage]._measuredLeft, 0);
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
					currentPage = self.currentPage,
					destination = -self.views[viewIndex]._measuredLeft,
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
				self._animateToPosition(destination, 0, duration, UI.ANIMATION_CURVE_EASE_IN_OUT, function(){
					self.properties.__values__.currentPage = viewIndex;
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
						destination += self.views[self._viewToRemoveAfterScroll]._measuredWidth;
						self._removeViewFromList(self._viewToRemoveAfterScroll);
						self._viewToRemoveAfterScroll = -1;
					}
					self.fireEvent("scrollEnd",{
						currentPage: viewIndex,
						view: self.views[viewIndex]
					});
				});
			}

			// If the scrollableView hasn't been laid out yet, we must wait until it is
			if (self._contentContainer.domNode.offsetWidth) {
				scroll();
			} else {
				once(self, "postlayout", scroll);
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
			currentPage: {
				set: function(value, oldValue) {
					if (value >= 0 && value < this.views.length) {
						this.scrollToView(value);
						return value;
					}
					return oldValue;
				},
				value: -1
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
					this.properties.__values__.currentPage = len ? 0 : -1;

					return value;
				},
				post: function() {
					this._updatePagingControl(this.currentPage,true);
				}
			}
		}

	});

});