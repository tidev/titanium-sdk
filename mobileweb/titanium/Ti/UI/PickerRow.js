define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom"],
	function(declare, FontWidget) {

	return declare("Ti.UI.PickerRow", FontWidget, {
		
		constructor: function() {
			
		},
		
		properties: {
			title: {
				get: function(value) {
					console.debug('Property "Titanium.UI.PickerRow#.title" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.PickerRow#.title" is not implemented yet.');
					return value;
				}
			}
		}
	
	});
	
});