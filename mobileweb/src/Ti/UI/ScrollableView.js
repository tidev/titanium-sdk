define("Ti/UI/ScrollableView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/lang", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], 
	function(declare, Widget, lang, dom, css, style) {

	var set = style.set,
		is = require.is,
		isDef = require.isDef,
		unitize = dom.unitize,
		undef;

	return declare("Ti.UI.ScrollableView", Widget, {
		
		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		_velocityThreshold: 0.4,
		
		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		_minimumFlickDistanceScaleFactor: 15,
		
		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		_minimumDragDistanceScaleFactor: 2,
		
		constructor: function(args){
			
			// Create the content container
			this._contentContainer = Ti.UI.createView({
				left: 0,
				top: 0,
				width: "100%",
				height: "100%"
			});
			set(this._contentContainer.domNode,"overflow","hidden");
			this.add(this._contentContainer);
			
			// Create the paging control container
			this.add(this._pagingControlContainer = Ti.UI.createView({
				width: "100%",
				height: 20,
				bottom: 0,
				backgroundColor: "black",
				opacity: 0,
				touchEnabled: false
			}));
			this._pagingControlContainer.add(this._pagingControlContentContainer = Ti.UI.createView({
				width: "auto",
				height: "100%",
				top: 0,
				touchEnabled: false
			}));
			
			// State variables
			this._viewToRemoveAfterScroll = -1;
			
			var initialPosition,
				animationView,
				swipeInitialized = false,
				viewsToScroll,
				touchEndHandled,
				startTime;
			// This touch end handles the case where a swipe was started, but turned out not to be a swipe
			this.addEventListener("touchend",function(e) {
				if (!touchEndHandled && swipeInitialized) {
					var width = this._measuredWidth,
						destinationLeft = viewsToScroll.indexOf(this.views[this.currentPage]) * -width;
					animationView.animate({
						duration: (300 + 0.2 * width) / (width - Math.abs(e._distance)) * 10,
						left: destinationLeft,
						curve: Ti.UI.ANIMATION_CURVE_EASE_OUT
					},lang.hitch(this,function(){
						this._contentContainer._removeAllChildren();
						this._contentContainer.add(this.views[this.currentPage]);
					}));
				}
			})
			this.addEventListener("swipe",function(e){
				
				// If we haven't started swiping yet, start swiping,
				var width = this._measuredWidth;
				if (!swipeInitialized) {
					swipeInitialized = true;
					touchEndHandled = false;
					startTime = (new Date()).getTime();
					
					// Create the list of views that can be scrolled, the ones immediately to the left and right of the current view
					initialPosition = 0;
					viewsToScroll = [];
					if (this.currentPage > 0) {
						viewsToScroll.push(this.views[this.currentPage - 1]);
						initialPosition = -width;
					}
					viewsToScroll.push(this.views[this.currentPage]);
					if (this.currentPage < this.views.length - 1) {
						viewsToScroll.push(this.views[this.currentPage + 1]);
					}
					
					// Create the animation div
					animationView = Ti.UI.createView({
						width: unitize(viewsToScroll.length * width),
						height: "100%",
						layout: "absolute",
						left: initialPosition,
						top: 0
					});
		
					// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
					this._contentContainer._removeAllChildren();
					for (var i = 0; i < viewsToScroll.length; i++) {
						var viewContainer = Ti.UI.createView({
							left: unitize(i * width),
							top: 0,
							width: unitize(width),
							height: "100%",
							layout: "horizontal" // Do a horizontal to force the child to (0,0) without overwriting the original position values
						});
						set(viewContainer.domNode,"overflow","hidden");
						viewContainer.add(viewsToScroll[i]);
						animationView.add(viewContainer);
					}
					
					// Set the initial position
					animationView.left = unitize(initialPosition);
					this._contentContainer.add(animationView);
					this._triggerLayout(true);
				}
				
				// Update the position of the animation div
				var newPosition = initialPosition + e._distance;
				newPosition = newPosition < 0 ? newPosition > -animationView._measuredWidth + width ? newPosition :-animationView._measuredWidth + width : 0;
				animationView.domNode.style.left = unitize(newPosition);
				
				// If the swipe is finished, we animate to the final position
				if (e._finishedSwiping) {
					swipeInitialized = false;
					touchEndHandled = true;
					
					// Determine whether this was a flick or a drag
					var velocity = Math.abs((e._distance) / ((new Date()).getTime() - startTime));
					var scaleFactor = velocity > this._velocityThreshold ? 
						this._minimumFlickDistanceScaleFactor : this._minimumDragDistanceScaleFactor
					
					// Find out which view we are animating to
					var destinationIndex = this.currentPage,
						animationLeft = initialPosition;
					if (e._distance > width / scaleFactor && this.currentPage > 0) {
						destinationIndex = this.currentPage - 1;
						animationLeft = 0;
					} else if (e._distance < -width / scaleFactor && this.currentPage < this.views.length - 1) {
						destinationIndex = this.currentPage + 1;
						if (viewsToScroll.length === 3) {
							animationLeft = -2 * width;
						} else {
							animationLeft = -width;
						}
					}
					
					var self = this;
					function finalizeSwipe() {
						self._contentContainer._removeAllChildren();
						self._contentContainer.add(self.views[destinationIndex]);
						self._triggerLayout(true);
						
						self.currentPage !== destinationIndex && self.fireEvent("scroll",{
							currentPage: destinationIndex,
							view: self.views[destinationIndex],
							x: e.x,
							y: e.y
						});
						
						self.properties.__values__.currentPage = destinationIndex;
					}
					
					// Check if the user attempted to scroll past the edge, in which case we directly reset the view instead of animation
					if (newPosition == 0 || newPosition == -animationView._measuredWidth + width) {
						finalizeSwipe();
					} else {
						// Animate the view and set the final view
						this._updatePagingControl(destinationIndex);
						animationView.animate({
							duration: 200 + (0.2 * width) / (width - Math.abs(e._distance)) * 10,
							left: animationLeft,
							curve: Ti.UI.ANIMATION_CURVE_EASE_OUT
						},lang.hitch(this,function(){
							finalizeSwipe();
						}));
					}
				}
			});
		},
		
		addView: function(view){
			if (view) {
				this.views.push(view);
	
				// Check if any children have been added yet, and if not load this view
				if (this.views.length == 1) {
					this.properties.__values__.currentPage = 0;
					this._contentContainer._removeAllChildren();
					this._contentContainer.add(view);
				}
				this._updatePagingControl(this.currentPage);
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
				this._contentContainer.add(this.views[viewIndex]);
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
				var animationView = Ti.UI.createView({
					width: unitize(viewsToScroll.length * width),
					height: "100%",
					layout: "absolute",
					left: initialPosition,
					top: 0
				});
	
				// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
				this._contentContainer._removeAllChildren();
				for (var i = 0; i < viewsToScroll.length; i++) {
					var viewContainer = Ti.UI.createView({
						left: unitize(i * width),
						top: 0,
						width: unitize(width),
						height: "100%",
						layout: "horizontal" // Do a horizontal to force the child to (0,0) without overwriting the original position values
					});
					set(viewContainer.domNode,"overflow","hidden");
					viewContainer.add(viewsToScroll[i]);
					animationView.add(viewContainer);
				}
				
				// Set the initial position
				animationView.left = unitize(initialPosition);
				this._contentContainer.add(animationView);
				this._triggerLayout(true);
	
				// Set the start time
				var duration = 300 + 0.2 * (width), // Calculate a weighted duration so that larger views take longer to scroll.
					distance = (viewsToScroll.length - 1) * width;
					
				this._updatePagingControl(viewIndex);
				animationView.animate({
					duration: duration,
					left: initialPosition + scrollingDirection * distance,
					curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
				},lang.hitch(this,function(){
					this._contentContainer._removeAllChildren();
					this._contentContainer.add(this.views[viewIndex]);
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
				var indicator = Ti.UI.createView({
					width: diameter,
					height: diameter,
					top: diameter / 2,
					left: i * 2 * diameter,
					backgroundColor: i === newIndex ? "white" : "grey"
				});
				set(indicator.domNode,"borderRadius",unitize(diameter / 2));
				this._pagingControlContentContainer.add(indicator);
			}
			!hidePagingControl && this._showPagingControl();
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",

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
					if (oldValue.length == 0 && value.length > 0) {
						this._contentContainer._removeAllChildren();
						this._contentContainer.add(value[0]);
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