define("Ti/UI/ScrollView", ["Ti/_/declare", "Ti/UI/View", "Ti/_/style"], function(declare, View, style) {

	return declare("Ti.UI.ScrollView", View, {
		
		constructor: function(args) {
			style.set(this.domNode, "overflow", "scroll");
		},
		
		scrollTo: function(x,y) {
			x !== null && (this.domNode.scrollLeft = parseInt(x));
			y !== null && (this.domNode.scrollTop = parseInt(y));
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",

		properties: {
			canCancelEvents: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.canCancelEvents" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.canCancelEvents" is not implemented yet.');
					return value;
				}
			},
			
			contentHeight: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.contentHeight" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.contentHeight" is not implemented yet.');
					return value;
				}
			},
			
			contentOffset: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.contentOffset" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.contentOffset" is not implemented yet.');
					return value;
				}
			},
			
			contentWidth: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.contentWidth" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.contentWidth" is not implemented yet.');
					return value;
				}
			},
			
			showHorizontalScrollIndicator: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.showHorizontalScrollIndicator" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.showHorizontalScrollIndicator" is not implemented yet.');
					return value;
				}
			},
			
			showVerticalScrollIndicator: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.ScrollView#.showVerticalScrollIndicator" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.ScrollView#.showVerticalScrollIndicator" is not implemented yet.');
					return value;
				}
			}
		}

	});

});