/*global define window*/
define(['Ti/_/declare', 'Ti/UI/View', 'Ti/_/dom', 'Ti/_/has', 'Ti/_/style', 'Ti/UI', 'Ti/_/browser'],
	function(declare, View, dom, has, style, UI, browser) {

	var setStyle = style.set,
		is = require.is,
		unitize = dom.unitize,
		on = require.on,
		once = on.once,
		global = window,
		transitionEnd = browser.runtime == 'webkit' ? 'webkitTransitionEnd' : 'transitionend',

		useTouch = has('touch'),
		usePointer = global.navigator.msPointerEnabled,

		// Maximum time that a gesture can be considered a flick
		maxFlickTime = 200,

		// Minimum distance that must be traveled to register the flick
		flickThreshold = 10,

		minAnimationTime = 25,

		maxAnimationTime = 1000,

		flickAnimationScaleFactor = 0.5,

		dragAnimationScaleFactor = 2;

	return declare('Ti.UI.ScrollableView', View, {

		constructor: function(){

			// Create the content container
			var containerDomNode,
				self = this,
				offsetX = 0;
			self._add(self._contentContainer = UI.createView({
				left: 0,
				top: 0,
				width: UI.SIZE,
				height: '100%',
				layout: 'constrainingHorizontal'
			}));
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
			self.__values__.properties.views = [];
			self._viewToRemoveAfterScroll = -1;

			on(self, 'postlayout', function() {
				self._animating || self._setTranslation(self.currentPage * -self._measuredWidth);
			});

			// NOTE: MSPointer* events should be converted to just pointer* once Windows Phone 8.1 is out
			on(containerDomNode, usePointer ? 'MSPointerDown' : useTouch ? 'touchstart' : 'mousedown', function(e) {
				var startX = e.touches ? e.touches[0].clientX : e.clientX,
					currentX = startX,
					startTime = Date.now(),
					width = self._measuredWidth,
					mouseMoveListener = function(e) {
						var currentPage = self.currentPage,
							offset = currentX - startX + offsetX;
						width = self._measuredWidth;
						e.preventDefault();
						currentX = e.touches ? e.touches[0].clientX : e.clientX;
						self._setTranslation((currentPage * -width) + offset);
						self.fireEvent('scroll', {
							currentPage: currentPage,
							currentPageAsFloat: currentPage - offset / width,
							view: self.views[currentPage]
						});
					},
					mouseUpListener = function(e) {
						var	now = Date.now(),
							isFlick = now - startTime < maxFlickTime,
							currentPage = self.currentPage,
							thresholdMet = Math.abs(startX - currentX) > (isFlick ? flickThreshold : width / 2),
							props = self.__values__.properties,
							duration = Math.abs(currentX - startX);
						global.removeEventListener(usePointer ? 'MSPointerMove' : useTouch ? 'touchmove' : 'mousemove', mouseMoveListener);
						global.removeEventListener(usePointer ? 'MSPointerUp' : useTouch ? 'touchend' : 'mouseup', mouseUpListener);
						width = self._measuredWidth;
						self._animating = 1;
						e.preventDefault();

						if (thresholdMet) {
							if (startX > currentX) {
								currentPage !== props.views.length - 1 && currentPage++;
							} else {
								currentPage !== 0 && currentPage--;
							}
							duration = width - duration;
						}
						self._showPagingControl(currentPage);
						offsetX = currentX - startX + offsetX;
						duration = Math.max(minAnimationTime, Math.min(maxAnimationTime,
							(isFlick ? flickAnimationScaleFactor : dragAnimationScaleFactor) * duration));
						setStyle(containerDomNode, 'transition', duration + 'ms ease-out');
						setTimeout(function(){
							once(containerDomNode, transitionEnd, function() {
								setStyle(containerDomNode, 'transition', '');
								self._animating = 0;
								props.currentPage = currentPage;
								self._updatePagingControl();
								self.fireEvent('scrollend',{
									currentPage: currentPage,
									view: self.views[currentPage]
								});
							});
							self._setTranslation(currentPage * -width);
						}, 1);
						self.fireEvent('dragend', {
							currentPage: currentPage,
							view: self.views[currentPage]
						});
					};
				self._showPagingControl(self.currentPage, 1);
				e.preventDefault();
				offsetX = self._animating ? offsetX || 0 : 0;
				setStyle(containerDomNode, 'transition', '');
				self._setTranslation((self.currentPage * -width) + offsetX);
				self._animating = 0;
				global.addEventListener(usePointer ? 'MSPointerMove' : useTouch ? 'touchmove' : 'mousemove', mouseMoveListener);
				global.addEventListener(usePointer ? 'MSPointerUp' : useTouch ? 'touchend' : 'mouseup', mouseUpListener);
				self.fireEvent('dragstart');
			});
		},

		_setTranslation: function(offset) {
			setStyle(this._contentContainer.domNode, 'transform', 'translatez(0) translatex(' + offset + 'px)');
		},

		_showPagingControl: function(newIndex, indefinite) {
			var self = this;
			if (!self.showPagingControl) {
				self._pagingControlContainer.opacity = 0;
				return;
			}
			self._pagingAnimation && self._pagingAnimation.cancel();
			self._pagingAnimation = self._pagingControlContainer.animate({
				duration: 250,
				opacity: 0.75
			});
			clearInterval(self._pagingTimeout);
			if (!indefinite && self.pagingControlTimeout > 0) {
				self._pagingTimeout = setTimeout(function() {
					self._pagingAnimation && self._pagingAnimation.cancel();
					self._pagingAnimation = self._pagingControlContainer.animate({
						duration: 750,
						opacity: 0
					}, function() {
						self._pagingAnimation = void 0;
					});
				}, self.pagingControlTimeout);
			} else {
				self._pagingAnimation = void 0;
			}
		},

		_updatePagingControl: function() {
			var contentContainer = this._pagingControlContentContainer,
				numViews = this.views.length,
				diameter = this.pagingControlHeight / 2;
			if (numViews !== contentContainer._numViews || diameter !== contentContainer._diameter) {
				contentContainer._numViews = numViews;
				contentContainer._diameter = diameter;
				contentContainer._removeAllChildren();
				for (var i = 0; i < this.views.length; i++) {
					contentContainer._add(UI.createView({
						width: diameter,
						height: diameter,
						left: 5,
						right: 5,
						backgroundColor: '#aaa',
						borderRadius: unitize(diameter / 2)
					}));
				}
				contentContainer._highlightedPage = -1;
			}
			if (contentContainer._highlightedPage !== this.currentPage) {
				contentContainer._highlightedPage < 0 ||
					(contentContainer._children[contentContainer._highlightedPage].backgroundColor = '#aaa');
				contentContainer._children[this.currentPage].backgroundColor = '#fff';
				contentContainer._highlightedPage = this.currentPage;
			}
		},

		addView: function(view) {
			if (view) {
				view.width = '100%';
				view.height = '100%';
				this.views.push(view);
				this._contentContainer._add(view);
				if (this.views.length == 1) {
					this.__values__.properties.currentPage = 0;
				}
				this._updatePagingControl();
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
				self.__values__.properties.currentPage--;
			}

			// Remove the view and update the paging control
			contentContainer._remove(self.views.splice(viewIndex,1)[0]);
			self.views.length || (self.__values__.properties.currentPage = -1);
			once(UI, 'postlayout', function() {
				setTimeout(function(){
					self._setTranslation(self.currentPage * -self._measuredWidth);
				}, 1);
			});
		},

		scrollToView: function(view, noAnimation) {
			var viewIndex = is(view,'Number') ? view : this.views.indexOf(view),
				self = this;

			// Sanity check
			if (viewIndex < 0 || viewIndex >= this.views.length || viewIndex == this.currentPage) {
				return;
			}

			function scroll(){

				// Calculate the views to be scrolled
				var contentContainer = self._contentContainer,
					containerDomNode = contentContainer.domNode,
					destination = -self.views[viewIndex]._measuredLeft,

					// Calculate a weighted duration so that larger views take longer to scroll.
					duration = Math.max(minAnimationTime, Math.min(maxAnimationTime,
						dragAnimationScaleFactor * contentContainer._measuredWidth));

				// Animate the views
				self._updatePagingControl();
				self._showPagingControl(viewIndex);

				if (noAnimation) {
					self._setTranslation(destination);
					self.__values__.properties.currentPage = viewIndex;
				} else {
					setStyle(containerDomNode, 'transition', duration + 'ms ease-out');
					setTimeout(function(){
						once(containerDomNode, transitionEnd, function() {
							setStyle(containerDomNode, 'transition', '');
							self._animating = 0;
							self.__values__.properties.currentPage = viewIndex;
							self._updatePagingControl();
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
						self._setTranslation(destination);
					}, 1);
				}
			}

			// If the scrollableView hasn't been laid out yet, we must wait until it is
			if (self._contentContainer.domNode.offsetWidth) {
				scroll();
			} else {
				once(self, 'postlayout', scroll);
			}
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		properties: {
			currentPage: {
				set: function(value, oldValue) {
					if (value >= 0 && value < this.views.length) {
						this.scrollToView(value, 1);
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
				post: function(value) {
					value || (this._pagingControlContainer.opacity = 0.75);
				},
				value: 3000
			},
			showPagingControl: false,
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
					this.__values__.properties.currentPage = len ? 0 : -1;

					return value;
				},
				post: '_updatePagingControl'
			}
		}

	});

});