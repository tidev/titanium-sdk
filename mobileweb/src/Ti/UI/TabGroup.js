define("Ti/UI/TabGroup", ["Ti/_/declare", "Ti/_/UI/SuperView"], function(declare, SuperView) {

	return declare("Ti.UI.TabGroup", SuperView, {

		addTab: function(x,y) {
			console.debug('Method "Titanium.UI.TabGroup#.addTab" is not implemented yet.');
		},
		
		removeTab: function(x,y) {
			console.debug('Method "Titanium.UI.TabGroup#.removeTab" is not implemented yet.');
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",

		properties: {
			activeTab: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TabGroup#.activeTab" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.activeTab" is not implemented yet.');
					return value;
				}
			},
			
			tabs: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TabGroup#.tabs" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TabGroup#.tabs" is not implemented yet.');
					return value;
				}
			}
			
		}

	});

});
