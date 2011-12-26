define("Ti/UI/ScrollableView", ["Ti/_/declare", "Ti/_/UI/Widget"], function(declare, Widget) {

	return declare("Ti.UI.ScrollableView", Widget, {
		
		constructor: function(args){
			
		},
		
		addView: function(view){
			
		},
		
		removeView: function(view) {
			
		},
		
		scrollToView: function(view) {
			// view is object OR INDEX!!
		},

		properties: {
			_defaultWidth: "100%",
			_defaultHeight: "100%",
			currentPage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.currentPage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.currentPage" is not implemented yet.');
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
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.views" is not implemented yet.');
					return value;
				},
				set: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollableView#.views" is not implemented yet.');
					return value;
				}
			}
		}

	});

});