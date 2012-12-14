define(['Ti/_/browser', 'Ti/_/declare', 'Ti/UI/View', 'Ti/_/lang', 'Ti/_/dom', 'Ti/_/style', 'Ti/UI'],
	function(browser, declare, View, lang, dom, style, UI) {

	var setStyle = style.set,
		is = require.is,
		unitize = dom.unitize,
		on = require.on,
		once = on.once,
		global = window,

		useTouch = 'ontouchstart' in global,

		// Maximum time that a gesture can be considered a flick
		maxFlickTime = 200,

		// Minimum distance that must be traveled to register the flick
		flickThreshold = 10;

	return declare('Ti.UI.ScrollableView', View, {

		constructor: function(){

			// Create the content container
			var containerDomNode,
				self = this;
			self._add(self._contentContainer = UI.createView({
				left: 0,
				top: 0,
				width: UI.SIZE,
				height: '100%',
				layout: 'constrainingHorizontal'
			}), 'horizontal');
			containerDomNode = self._contentContainer.domNode;

			// Create the paging control container
			self._add(self._pagingControlContainer = UI.createView({
				width: '100%',
				height: 20,
				bottom: 0,
				backgroundColor: 'black',
				opacity: 0,
				touchEnabled: false
			}));

			self._pagingControlContainer._add(self._pagingControlContentContainer = UI.createView({
				width: UI.SIZE,
				height: '100%',
				top: 0,
				touchEnabled: false,
				layout: 'constrainingHorizontal'
			}));

			// State variables
			self.properties.__values__.views = [];
			self._viewToRemoveAfterScroll = -1;

			on(self, 'postlayout', self._updateTranslation);

			on(containerDomNode, useTouch ? 'touchstart' : 'mousedown', function(e) {
				var startX = e.touches ? e.touches[0].clientX : e.clientX,
					startTime = Date.now(),
					currentX,
					mouseMoveListener = function(e) {
						var width = self._measuredWidth;
						e.preventDefault();
						currentX = e.touches ? e.touches[0].clientX : e.clientX;
						setStyle(containerDomNode, 'transform', 'translatez(0) translatex(' + ((self.currentPage * -width) + currentX - startX) + 'px)');
					},
					mouseUpListener = function(e) {
						var	now = Date.now(),
							isFlick = now - startTime < maxFlickTime,
							width = self._measuredWidth,
							currentPage = self.currentPage,
							thresholdMet = Math.abs(startX - currentX) > (isFlick ? flickThreshold : width / 2),
							props = self.properties.__values__;
						global.removeEventListener(useTouch ? 'touchmove' : 'mousemove', mouseMoveListener);
						global.removeEventListener(useTouch ? 'touchend' : 'mouseup', mouseUpListener);
						e.preventDefault();

						if (thresholdMet) {
							if (startX > currentX) {
								currentPage !== props.views.length - 1 && props.currentPage++;
							} else {
								currentPage !== 0 && props.currentPage--;
							}
						}
						setStyle(containerDomNode, 'transform', 'translatez(0) translatex(' + (self.currentPage * -width) + 'px)');
					};
				e.preventDefault();
				global.addEventListener(useTouch ? 'touchmove' : 'mousemove', mouseMoveListener);
				global.addEventListener(useTouch ? 'touchend' : 'mouseup', mouseUpListener);
			});
		},

		addView: function(view){
			if (view) {
				this.views.push(view);
				this._contentContainer._add(view);
				if (this.views.length == 1) {
					this.properties.__values__.currentPage = 0;
				} else {
					setStyle(view.domNode, 'display', 'none');
				}
			}
		},

		removeView: function(view) {

			// Get and validate the location of the view
			var viewIndex = is(view,'Number') ? view : this.views.indexOf(view);
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
			once(UI, 'postlayout', function() {
				setTimeout(function(){
					self._updateTranslation();
				}, 1);
			});
			self._updatePagingControl(self.currentPage);
		},

		scrollToView: function(view) {
			var viewIndex = is(view,'Number') ? view : this.views.indexOf(view),
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
					i,

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
					self.fireEvent('scrollend',{
						currentPage: viewIndex,
						view: self.views[viewIndex]
					});
				});
			}

			// If the scrollableView hasn't been laid out yet, we must wait until it is
			if (self._contentContainer.domNode.offsetWidth) {
				scroll();
			} else {
				once(self, 'postlayout', scroll);
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
			var contentContainer = this._pagingControlContentContainer,
				numViews = this.views.length,
				diameter = this.pagingControlHeight / 2;
			if (this.showPagingControl && (!this._isPagingControlActive || newIndex !== contentContainer._currentIndex ||
					numViews !== contentContainer._numViews || diameter !== contentContainer._diameter)) {
				contentContainer._currentIndex = newIndex;
				contentContainer._numViews = numViews;
				contentContainer._diameter = diameter;
				contentContainer._removeAllChildren();
				for (var i = 0; i < this.views.length; i++) {
					var indicator = UI.createView({
						width: diameter,
						height: diameter,
						left: 5,
						right: 5,
						backgroundColor: i === newIndex ? 'white' : 'grey',
						borderRadius: unitize(diameter / 2)
					});
					contentContainer._add(indicator);
				}
				hidePagingControl || this._showPagingControl();
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
				value: 'black'
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
					this.pagingControlTimeout === 0 && this._updatePagingControl();
					return value;
				},
				value: 1250
			},
			showPagingControl: {
				set: function(value) {
					this.pagingControlTimeout === 0 && this._updatePagingControl();
					return value;
				},
				value: false
			},
			views: {
				set: function(value) {

					// Value must be an array
					if (!is(value,'Array')) {
						return;
					}

					// Add the views to the content container
					var i = 0,
						len = value.length,
						contentContainer = this._contentContainer,
						view;
					contentContainer._removeAllChildren();
					for(; i < len; i++) {
						(view = value[i]).width = '100%';
						view.height = '100%';
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