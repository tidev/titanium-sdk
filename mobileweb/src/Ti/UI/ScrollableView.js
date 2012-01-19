define("Ti/UI/ScrollableView", 
	["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/lang", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], 
	function(declare, Widget, lang, dom, css, style) {

	var set = style.set,
		is = require.is,
		isDef = require.isDef,
		unitize = dom.unitize,
		undef;

	return declare("Ti.UI.ScrollableView", Widget, {
		
		constructor: function(args){
			
			this._setContent();
			
			// State variables
			this._viewToRemoveAfterScroll = -1;
			this._currentPage = 0;
			
			var initialPosition,
				animationView,
				swipeInitialized = false,
				viewsToScroll;
			this.addEventListener("swipe",function(e){
				
				// If we haven't started swiping yet, start swiping,
				var width = this._measuredWidth;
				if (!swipeInitialized) {
					swipeInitialized = true;
					
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
					this._setContent(animationView);
					
					// We have to force a non-delayed layout right now
					Ti.UI._doForcedFullLayout();
				}
				
				// Update the position of the animation div
				var newPosition = initialPosition + e._distance;
				newPosition = newPosition < 0 ? newPosition > -animationView._measuredWidth + width ? newPosition :-animationView._measuredWidth + width : 0;
				animationView.domNode.style.left = unitize(newPosition);
				
				// If the swipe is finished, we animate to the final position
				if (e._finishedSwiping) {
					swipeInitialized = false;
					
					// Find out which view we are animating to
					var destinationIndex = this.currentPage,
						animationLeft = initialPosition;
					if (e._distance > width / 2 && this._currentPage > 0) {
						destinationIndex = this._currentPage - 1;
						animationLeft = 0;
					} else if (e._distance < -width / 2 && this._currentPage < this.views.length - 1) {
						destinationIndex = this._currentPage + 1;
						if (viewsToScroll.length === 3) {
							animationLeft = -2 * width;
						} else {
							animationLeft = -width;
						}
					}
					
					// Check if the user attempted to scroll past the edge, in which case we directly reset the view instead of animation
					if (newPosition == 0 || newPosition == -animationView._measuredWidth + width) {
						this._setContent(this.views[destinationIndex]);
					} else {
						// Animate the view and set the final view
						animationView.animate({
							duration: (300 + 0.2 * width) / (width - Math.abs(e._distance)) * 10,
							left: animationLeft,
							curve: Ti.UI.ANIMATION_CURVE_EASE_OUT
						},lang.hitch(this,function(){
							this._setContent(this.views[destinationIndex]);
							this._currentPage = destinationIndex;
						}));
					}
				}
			});
		},
		
		addView: function(view){
			// Sanity check
			if (view) {
				this.views.push(view);
	
				// Check if any children have been added yet, and if not load this view
				this.views.length == 1 && this.scrollToView(0);
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
					this._setContent();
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
				this.currentPage--;
			}
		},
		
		_setContent: function(view) {
			
			// Remove and garbage collect the old container
			this.container && this.remove(this.container);
			this.container = null;
			
			// Create the new container
			this.container = Ti.UI.createView({
				left: 0,
				top: 0,
				width: "100%",
				height: "100%"
			});
			set(this.container.domNode,"overflow","hidden");
			this.add(this.container);
			
			// Add the view to the container
			view && this.container.add(view);
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
			if (!this.container.domNode.offsetWidth) {
				this._setContent(this.views[viewIndex]);
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
				this._setContent(animationView);
				
				// We have to force a non-delayed layout right now
				Ti.UI._doForcedFullLayout();
	
				// Set the start time
				var duration = 300 + 0.2 * width, // Calculate a weighted duration so that larger views take longer to scroll.
					distance = (viewsToScroll.length - 1) * width;
					
				animationView.animate({
					duration: duration,
					left: initialPosition + scrollingDirection * distance,
					curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
				},lang.hitch(this,function(){
					this._setContent(this.views[viewIndex]);
					this._currentPage = viewIndex;
					if (this._viewToRemoveAfterScroll != -1) {
						this._removeViewFromList(this._viewToRemoveAfterScroll);
						this._viewToRemoveAfterScroll = -1;
					}
				}));
			}
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",

		properties: {
			currentPage: {
				get: function() {
					return this._currentPage;
				},
				set: function(value) {
					if (value >= 0 && value < this.views.length) {
						this.scrollToView(value);
					}
					this._currentPage = value;
					return value;
				}
			},
			pagingControlColor: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlColor" is not implemented yet.');
					return value;
				}
			},
			pagingControlHeight: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlHeight" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlHeight" is not implemented yet.');
					return value;
				}
			},
			pagingControlTimeout: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlTimeout" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.pagingControlTimeout" is not implemented yet.');
					return value;
				}
			},
			showPagingControl: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.showPagingControl" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.showPagingControl" is not implemented yet.');
					return value;
				}
			},
			views: {
				set: function(value, oldValue) {
					// Value must be an array
					if (!is(value,"Array")) {
						return;
					}
					oldValue.length == 0 && value.length > 0 && this._setContent(value[0]);
					return value;
				},
				value: []
			}
		}

	});

});