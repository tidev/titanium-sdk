Ti._5.createClass("Titanium.UI.ScrollableView", function(args){
	args = require.mix({
		height: "100%",
		unselectable: true,
		width: "100%"
	}, args);

	var obj = this,
		domNode = Ti._5.DOMView(obj, "div", args, "ScrollableView"),
		_currentPage = args.currentPage || -1,
		_interval = null;

	// Interfaces
	Ti._5.Touchable(obj, args);
	Ti._5.Styleable(obj, args);
	Ti._5.Positionable(obj, args);	

	domNode.style.position = "absolute";
	domNode.style.overflow = "hidden";

	// Properties
	Ti._5.prop(obj, {
		"currentPage": {
			get: function(){return _currentPage;},
			set: function(val){
				if (val >= 0 && val < obj.views.length) {
					obj._scrollToViewPosition(val);
					_currentPage = val;
				}
			}
		},
		"maxZoomScale": null,
		"minZoomScale": null,
		"pagingControlColor": null,
		"pagingControlHeight": null,
		"showPagingControl": null,
		"views": []
	});

	// Methods
	obj.addView = function(view) {
		// Sanity check
		if (view) {
			obj.views.push(view);

			// Check if any children have been added yet, and if not load this view
			_currentPage === -1 && obj._scrollToViewPosition(0);
		}
	};
	obj._viewToRemoveAfterScroll = -1;
	obj._removeViewFromList = function(viewIndex) {
		// Remove the view
		obj.views.splice(viewIndex,1);

		// Update the current view if necessary
		if (viewIndex < _currentPage){
			_currentPage--;
		}
	}
	obj.removeView = function(view) {
		// Get and validate the location of the view
		var viewIndex = obj.views.indexOf(view);
		if (viewIndex == -1) {
			return;
		}

		// Update the view if this view was currently visible
		if (viewIndex == _currentPage) {
			obj._viewToRemoveAfterScroll = viewIndex;
			if (obj.views.length == 1) {
				obj._removeViewFromList(viewIndex);
				domNode.removeChild(domNode.firstChild);
			} else {
			    obj._scrollToViewPosition(viewIndex == obj.views.length -1 ? --viewIndex : ++viewIndex);
			}
		} else {
			obj._removeViewFromList(viewIndex);
		}
	};
	obj.scrollToView = function(view) {
		obj._scrollToViewPosition(obj.views.indexOf(view))
	};
	obj._scrollToViewPosition = function(viewIndex) {
		// Sanity check
		if (viewIndex < 0 || viewIndex >= obj.views.length || viewIndex == _currentPage) {
			return;
		}

		obj._attachFinalView = function(view) {
			// Remove the previous container
			if (domNode.childNodes.length > 0) {
				domNode.removeChild(domNode.firstChild);
			}

			// Attach the new container
			var _contentContainer = document.createElement("div");
			_contentContainer.style.position = "absolute";
			_contentContainer.style.width = "100%";
			_contentContainer.style.height = "100%";
			_contentContainer.appendChild(view);
			domNode.appendChild(_contentContainer);
		};

		// If the scrollableView hasn"t been laid out yet, we can"t do much since the scroll distance is unknown.
		// At the same time, it doesn"t matter since the user won"t see it anyways. So we just append the new
		// element and don"t show the transition animation.
		if (!domNode.offsetWidth) {
			obj._attachFinalView(obj.views[viewIndex].dom);
		} else {
			// Stop the previous timer if it is running (i.e. we are in the middle of an animation)
			_interval && clearInterval(_interval);

			// Remove the previous container
			if (domNode.childNodes.length) {
				domNode.removeChild(domNode.firstChild);
			}

			// Calculate the views to be scrolled
			var _w = domNode.offsetWidth,
				_viewsToScroll = [],
				_scrollingDirection = -1,
				_initialPosition = 0;
			if (viewIndex > _currentPage) {
				for (var i = _currentPage; i <= viewIndex; i++) {
					_viewsToScroll.push(obj.views[i].dom);
				}
			} else {
				for (var i = viewIndex; i <= _currentPage; i++) {
					_viewsToScroll.push(obj.views[i].dom);
				}
				_initialPosition = -(_viewsToScroll.length - 1) * _w;
				_scrollingDirection = 1;
			}

			// Create the animation div
			var _contentContainer = document.createElement("div");
			_contentContainer.style.position = "absolute";
			_contentContainer.style.width = _viewsToScroll.length * _w;
			_contentContainer.style.height = "100%";
			domNode.appendChild(_contentContainer);

			// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
			for (var i = 0; i < _viewsToScroll.length; i++) {
				var _viewDiv = document.createElement("div");
				_viewDiv.style.position = "absolute";
				_viewDiv.style.width = _w + "px";
				_viewDiv.style.height = "100%";
				_viewDiv.appendChild(_viewsToScroll[i]);
				_contentContainer.appendChild(_viewDiv);
				_viewDiv.style.left = i * _w + "px";
			}

			// Attach the div to the scrollableView
			domNode.appendChild(_contentContainer);
			_contentContainer.style.left = _initialPosition + "px";

			// Set the start time
			var _startTime = (new Date()).getTime(),
				_duration = 300 + 0.2 * _w, // Calculate a weighted duration so that larger views take longer to scroll.
				_distance = (_viewsToScroll.length - 1) * _w;

			// Start the timer
			_interval = setInterval(function(){
				// Calculate the new position
				var _currentTime = ((new Date()).getTime() - _startTime),
					_normalizedTime = _currentTime / (_duration / 2),
					_newPosition;
				if (_normalizedTime < 1) {
					_newPosition = _distance / 2 * _normalizedTime * _normalizedTime;
				} else {
					_normalizedTime--;
					_newPosition = -_distance / 2 * (_normalizedTime * (_normalizedTime - 2) - 1);
				}

				// Update the position of the div
				_contentContainer.style.left = _scrollingDirection * Math.round(_newPosition) + _initialPosition + "px";

				// Check if the transition is finished.
				if (_currentTime >= _duration) {
					clearInterval(_interval);
					_interval = null;
					obj._attachFinalView(obj.views[viewIndex].dom);
					if (obj._viewToRemoveAfterScroll != -1) {
						obj._removeViewFromList(obj._viewToRemoveAfterScroll);
						obj._viewToRemoveAfterScroll = -1;
					}
		    	}
			},32); // Update around 32 FPS.
		}
		_currentPage = viewIndex;
	};

	// If some views were defined via args, process them now
	obj.views.length && obj._scrollToViewPosition(_currentPage != -1 ? _currentPage : 0);

	// Events
	obj.addEventListener("scroll", function() {
		console.debug("Event "scroll" is not implemented yet.");
	});

	require.mix(obj, args);
});