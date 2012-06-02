define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI", "Ti/_/event"],
	function(declare, Widget, lang, dom, style, UI, event) {

	var setStyle = style.set,
		is = require.is,
		isDef = lang.isDef,
		unitize = dom.unitize,
		on = require.on,

		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		distanceThreshold = 50,

		// The maximum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		angleThreshold = Math.PI/6, // 30 degrees

		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		velocityThreshold = 0.5,

		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		minimumFlickDistanceScaleFactor = 15,

		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		minimumDragDistanceScaleFactor = 2;

		// This is the velocity used to animate to the end when there is no available velocity
		defaultVelocity = 0.2;

	return declare("Ti.UI.ScrollableView", Widget, {

		constructor: function(args){

			// Create the content container
			this._contentContainer = UI.createView({
				left: 0,
				top: 0,
				width: "100%",
				height: "100%"
			});
			setStyle(this._contentContainer.domNode, "overflow", "hidden");
			this._add(this._contentContainer);

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
			this._viewToRemoveAfterScroll = -1;

			var initialPosition,
				startX,
				animationView,
				viewsToScroll,
				startTime,
				previousPosition,
				self = this,
				width,
				mouseIsDown,
				handles;

			function touchify(e, finalize) {
				return require.mix(e, {
					touches: finalize ? [] : [e],
					targetTouches: [],
					changedTouches: [e]
				});
			}

			function finalizeSwipe(destinationIndex, x, y) {
				self._contentContainer._removeAllChildren();
				self._contentContainer._add(self.views[destinationIndex]);
				self._triggerLayout(true);
				self.currentPage !== destinationIndex && self.fireEvent("scroll",{
					currentPage: destinationIndex,
					view: self.views[destinationIndex],
					x: x,
					y: y
				});
				self.properties.__values__.currentPage = destinationIndex;
			}

			function cancelScroll() {
				if (startX) {
					// Update paging control
					self._updatePagingControl(self.currentPage);

					// Animate the view and set the final view
					animationView.animate({
						duration: 400,
						left: -width,
						curve: UI.ANIMATION_CURVE_EASE_OUT
					},function() {
						finalizeSwipe(self.currentPage);
					});

					startX = null;
				}
			}

			function touchStart(e) {
				if (e.touches.length == 1 && e.changedTouches.length == 1) {
					var i = 0,
						win = window;
					width = self._measuredWidth,
					startTime = (new Date).getTime();
					startX = e.changedTouches[0].clientX;

					// Create the list of views that can be scrolled, the ones immediately to the left and right of the current view
					initialPosition = 0;
					viewsToScroll = [];
					if (self.currentPage > 0) {
						viewsToScroll.push(self.views[self.currentPage - 1]);
						initialPosition = -width;
					}
					viewsToScroll.push(self.views[self.currentPage]);
					if (self.currentPage < self.views.length - 1) {
						viewsToScroll.push(self.views[self.currentPage + 1]);
					}

					// Create the animation div
					animationView = UI.createView({
						width: unitize(viewsToScroll.length * width),
						height: "100%",
						left: initialPosition,
						top: 0
					});

					// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
					self._contentContainer._removeAllChildren();
					for (; i < viewsToScroll.length; i++) {
						var viewContainer = UI.createView({
							left: unitize(i * width),
							top: 0,
							width: unitize(width),
							height: "100%"
						});
						viewContainer._layout._defaultHorizontalPosition = "start";
						viewContainer._layout._defaultVerticalPosition = "start";
						setStyle(viewContainer.domNode,"overflow","hidden");
						viewContainer._add(viewsToScroll[i]);
						animationView._add(viewContainer);
					}

					// Set the initial position
					animationView.left = unitize(initialPosition);
					self._contentContainer._add(animationView);
					self._triggerLayout(true);

					handles = [
						// Register for move type events
						on(win, "touchmove", touchMove),
						on(win, "mousemove", function(e) {
							mouseIsDown && touchMove(touchify(e));
						}),

						// Register for cancel type events
						on(win, "touchcancel", touchCancel),

						// Register for end type events
						on(win, "touchend", touchEnd),
						on(win, "mouseup", function(e) {
							mouseIsDown = 0;
							touchEnd(touchify(e, 1));
						})
					];
				}
			};
			on(this.domNode, "touchstart", touchStart);
			on(this.domNode, "mousedown", function(e) {
				mouseIsDown = 1;
				touchStart(touchify(e));
			});

			function touchMove(e) {
				if (e.touches.length == 1 && e.changedTouches.length == 1 && isDef(startX)) {
					width = self._measuredWidth;
					
					// Update the position of the animation div
					var newPosition = initialPosition + e.changedTouches[0].clientX - startX;
					newPosition = newPosition < 0 ? newPosition > -animationView._measuredWidth + width ? newPosition :-animationView._measuredWidth + width : 0;
					animationView.domNode.style.left = unitize(newPosition);
				} else {
					cancelScroll();
				}
			}

			function touchCancel() {
				event.off(handles);
				cancelScroll();
			}

			function touchEnd(e) {
				event.off(handles);
				if (e.touches.length == 0 && e.changedTouches.length == 1 && isDef(startX)) {
					width = self._measuredWidth;

					var x = e.changedTouches[0].clientX,
						y = e.changedTouches[0].clientX,
						distance = x - startX,
						destinationIndex = self.currentPage,
						animationLeft = initialPosition,
						velocity = Math.abs(distance / ((new Date).getTime() - startTime)),
						scaleFactor = velocity > velocityThreshold ? 
							minimumFlickDistanceScaleFactor : minimumDragDistanceScaleFactor,
						newPosition = initialPosition + e.changedTouches[0].clientX - startX;
					newPosition = newPosition < 0 ? newPosition > -animationView._measuredWidth + width ? newPosition :-animationView._measuredWidth + width : 0;
					animationView.domNode.style.left = unitize(newPosition);

					// Find out which view we are animating to
					if (distance > width / scaleFactor && self.currentPage > 0) {
						destinationIndex = self.currentPage - 1;
						animationLeft = 0;
					} else if (distance < -width / scaleFactor && self.currentPage < self.views.length - 1) {
						destinationIndex = self.currentPage + 1;
						if (viewsToScroll.length === 3) {
							animationLeft = -2 * width;
						} else {
							animationLeft = -width;
						}
					}

					// Check if the user attempted to scroll past the edge, in which case we directly reset the view instead of animation
					self._updatePagingControl(destinationIndex);
					if (newPosition == 0 || newPosition == -animationView._measuredWidth + width) {
						finalizeSwipe(destinationIndex, x, y);
					} else {
						// Animate the view and set the final view
						animationView.animate({
							duration: 200 + (0.2 * width) / (width - Math.abs(distance)) * 10,
							left: animationLeft,
							curve: UI.ANIMATION_CURVE_EASE_OUT
						},function() {
							finalizeSwipe(destinationIndex, x, y);
						});
					}
					startX = null;
				} else {
					cancelScroll();
				}
			}
		},

		addView: function(view){
			if (view) {
				this.views.push(view);
	
				// Check if any children have been added yet, and if not load this view
				if (this.views.length == 1) {
					this.properties.__values__.currentPage = 0;
					this._contentContainer._removeAllChildren();
					this._contentContainer._add(view);
				}
				this._updatePagingControl(this.currentPage);
				this._publish(view);
			}
		},

		removeView: function(view) {
			
			// Get and validate the location of the view
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view);
			if (viewIndex < 0 || viewIndex >= this.views.length) {
				return;
			}
	
			// Update the view if this view was currently visible
			if (viewIndex == this.currentPage) {
				if (this.views.length == 1) {
					this._contentContainer._removeAllChildren();
					this._removeViewFromList(viewIndex);
				} else {
					this._viewToRemoveAfterScroll = viewIndex;
				    this.scrollToView(viewIndex == this.views.length - 1 ? --viewIndex : ++viewIndex);
				}
			} else {
				this._removeViewFromList(viewIndex);
			}
		},

		_removeViewFromList: function(viewIndex) {
			// Remove the view
			this.views.splice(viewIndex,1);
	
			// Update the current view if necessary
			if (viewIndex < this.currentPage){
				this.properties.__values__.currentPage--;
			}
			
			this._updatePagingControl(this.currentPage);
			this._unpublish(view);
		},

		scrollToView: function(view) {
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view)
			
			// Sanity check
			if (viewIndex < 0 || viewIndex >= this.views.length || viewIndex == this.currentPage) {
				return;
			}
	
			// If the scrollableView hasn't been laid out yet, we can't do much since the scroll distance is unknown.
			// At the same time, it doesn't matter since the user won't see it anyways. So we just append the new
			// element and don't show the transition animation.
			if (!this._contentContainer.domNode.offsetWidth) {
				this._contentContainer._removeAllChildren();
				this._contentContainer._add(this.views[viewIndex]);
			} else {
				
				// Calculate the views to be scrolled
				var width = this._measuredWidth,
					viewsToScroll = [],
					scrollingDirection = -1,
					initialPosition = 0;
				if (viewIndex > this.currentPage) {
					for (var i = this.currentPage; i <= viewIndex; i++) {
						viewsToScroll.push(this.views[i]);
					}
				} else {
					for (var i = viewIndex; i <= this.currentPage; i++) {
						viewsToScroll.push(this.views[i]);
					}
					initialPosition = -(viewsToScroll.length - 1) * width;
					scrollingDirection = 1;
				}
	
				// Create the animation div
				var animationView = UI.createView({
					width: unitize(viewsToScroll.length * width),
					height: "100%",
					left: initialPosition,
					top: 0
				});
	
				// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
				this._contentContainer._removeAllChildren();
				for (var i = 0; i < viewsToScroll.length; i++) {
					var viewContainer = UI.createView({
						left: unitize(i * width),
						top: 0,
						width: unitize(width),
						height: "100%"
					});
					viewContainer._layout._defaultHorizontalPosition = "start";
					viewContainer._layout._defaultVerticalPosition = "start";
					setStyle(viewContainer.domNode,"overflow","hidden");
					viewContainer._add(viewsToScroll[i]);
					animationView._add(viewContainer);
				}
				
				// Set the initial position
				animationView.left = unitize(initialPosition);
				this._contentContainer._add(animationView);
				this._triggerLayout(true);
	
				// Set the start time
				var duration = 300 + 0.2 * (width), // Calculate a weighted duration so that larger views take longer to scroll.
					distance = (viewsToScroll.length - 1) * width;
					
				this._updatePagingControl(viewIndex);
				animationView.animate({
					duration: duration,
					left: initialPosition + scrollingDirection * distance,
					curve: UI.ANIMATION_CURVE_EASE_IN_OUT
				},lang.hitch(this,function(){
					this._contentContainer._removeAllChildren();
					this._contentContainer._add(this.views[viewIndex]);
					this._triggerLayout(true);
					this.properties.__values__.currentPage = viewIndex;
					if (this._viewToRemoveAfterScroll != -1) {
						this._removeViewFromList(this._viewToRemoveAfterScroll);
						this._viewToRemoveAfterScroll = -1;
					}
					this.fireEvent("scroll",{
						currentPage: viewIndex,
						view: this.views[viewIndex]
					});
				}));
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
					this.pagingControlTimeout == 0 && this._hidePagingControl();
					return value;
				},
				value: 1250
			},
			showPagingControl: {
				set: function(value) {
					this.pagingControlTimeout == 0 && this._hidePagingControl();
					return value;
				},
				value: false
			},
			views: {
				set: function(value, oldValue) {
					
					// Value must be an array
					if (!is(value,"Array")) {
						return;
					}
					
					// Mark all views as added
					var i = 0,
						len = oldValue.length;
					for(; i < len; i++) {
						this._unpublish(oldValue[i]);
					}
					for(i = 0, len = value.length; i < len; i++) {
						this._publish(value[i]);
					}
					
					// Add the default page
					if (value.length > 0) {
						this._contentContainer._removeAllChildren();
						this._contentContainer._add(value[0]);
					}
					this.properties.__values__.currentPage = 0;
					return value;
				},
				post: function() {
					this._updatePagingControl(this.currentPage,true);
				},
				value: []
			}
		}

	});

});