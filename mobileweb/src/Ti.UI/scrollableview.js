Ti._5.createClass('Titanium.UI.ScrollableView', function(args){
	var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'ScrollableView');
	Ti._5.Touchable(this, args);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);	
	
	this.dom.style.position = 'absolute';
	this.dom.style.overflow = 'hidden';

	// Properties
	var _currentPage = -1;
	Object.defineProperty(this, 'currentPage', {
		get: function(){return _currentPage;},
		set: function(val){return _currentPage = val;}
	});

	var _maxZoomScale = null;
	Object.defineProperty(this, 'maxZoomScale', {
		get: function(){return _maxZoomScale;},
		set: function(val){return _maxZoomScale = val;}
	});

	var _minZoomScale = null;
	Object.defineProperty(this, 'minZoomScale', {
		get: function(){return _minZoomScale;},
		set: function(val){return _minZoomScale = val;}
	});

	var _pagingControlColor = null;
	Object.defineProperty(this, 'pagingControlColor', {
		get: function(){return _pagingControlColor;},
		set: function(val){return _pagingControlColor = val;}
	});

	var _pagingControlHeight = null;
	Object.defineProperty(this, 'pagingControlHeight', {
		get: function(){return _pagingControlHeight;},
		set: function(val){return _pagingControlHeight = val;}
	});

	var _showPagingControl = null;
	Object.defineProperty(this, 'showPagingControl', {
		get: function(){return _showPagingControl;},
		set: function(val){return _showPagingControl = val;}
	});

	var _views = [];
	Object.defineProperty(this, 'views', {
		get: function(){return _views;},
		set: function(val){return _views = val;}
	});

	// Methods
	this.addView = function(view){
		_views.push(view);
		
		// Check if any children have been added yet, and if not load this view
		if (_currentPage == -1) {
			obj._scrollToViewPosition(0);
		}
	};
	this.removeView = function(view){
		
		// Get and validate the location of the view
		viewIndex = _views.indexOf(view);
		if (viewIndex == -1) {
			return
		}
		
		// Update the view if this view was currently visible
		if (viewIndex == _currentPage) {
			if (viewIndex == _views.length - 1) {
				obj._scrollToViewPosition(viewIndex - 1);
			} else if (_views.length == 0) {
				obj.dom.removeChild(obj.dom.firstChild);
			} else {
				obj._scrollToViewPosition(viewIndex + 1);
			}
		}
		
		// Remove the view
		_views.splice(viewIndex,1);
		
		// Update the current view if necessary
		if (viewIndex < _currentPage){
			_currentPage--;
		}
	};
	this.scrollToView = function(view){
		this._scrollToViewPosition(_views.indexOf(view))
	};
	this._scrollToViewPosition = function(viewIndex){
		
		// Sanity check
		if (viewIndex < 0 || viewIndex >= _views.length || viewIndex == _currentPage) {
			return;
		}
		
		// Remove the previous container
		if (obj.dom.childNodes.length > 0) {
			obj.dom.removeChild(obj.dom.firstChild);
		}
		
		// If the scrollableView hasn't been laid out yet, we can't do much since the scroll distance is unknown.
		// At the same time, it doesn't matter since the user won't see it anyways. So we just append the new
		// element and don't show the transition animation.
		if (obj.dom.offsetWidth == 0) {
			var _contentContainer = document.createElement('div');
			_contentContainer.style.position = "absolute";
			_contentContainer.style.width = "100%";
			_contentContainer.style.height = "100%";
			_contentContainer.appendChild(_views[viewIndex].dom);
			obj.dom.appendChild(_contentContainer);
		} else {
			
			// Calculate the views to be scrolled
			var _w = obj.dom.offsetWidth
			var _viewsToScroll = []
			var _scrollingDirection = -1;
			var _initialPosition = 0
			if (viewIndex > _currentPage) {
				for (var i = _currentPage; i <= viewIndex; i++) {
					_viewsToScroll.push(_views[i].dom);
				}
			} else {
				for (var i = viewIndex; i <= _currentPage; i++) {
					_viewsToScroll.push(_views[i].dom);
				}
				_initialPosition = -(_viewsToScroll.length - 1) * _w;
				_scrollingDirection = 1;
			}
			
			// Create the animation div
			var _contentContainer = document.createElement('div');
			_contentContainer.style.position = "absolute";
			_contentContainer.style.width = _viewsToScroll.length * _w;
			_contentContainer.style.height = obj.dom.offsetHeight;
			obj.dom.appendChild(_contentContainer);
			
			// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
			for (var i = 0; i < _viewsToScroll.length; i++) {
				var _viewDiv = document.createElement('div');
				_viewDiv.style.position = 'absolute';
				_viewDiv.style.width = _w + "px";
				_viewDiv.appendChild(_viewsToScroll[i]);
				_contentContainer.appendChild(_viewDiv);
				_viewDiv.style.left = i * _w + "px";
			}
			
			// Attach the div to the scrollableView
			obj.dom.appendChild(_contentContainer);
			_contentContainer.style.left = _initialPosition + "px";
			
			// Set the start time
			var _startTime = (new Date()).getTime();
			var _duration = 300 + 0.2 * _w; // Calculate a weighted duration so that larger views take longer to scroll.
			var _distance = (_viewsToScroll.length - 1) * _w;
			var _interval = setInterval(function(){
				
				// Calculate the new position
				var _currentTime = ((new Date()).getTime() - _startTime)
				var _normalizedTime = _currentTime / (_duration / 2);
				var _newPosition;
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
		    	}
			},32); // Update around 32 FPS.
		}
		_currentPage = viewIndex;
	};

	// Events
	this.addEventListener('scroll', function(){
		console.debug('Event "scroll" is not implemented yet.');
	});

	Ti._5.presetUserDefinedElements(this, args);
});