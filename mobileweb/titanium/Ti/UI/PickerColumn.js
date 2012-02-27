define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom"],
	function(declare, View) {

	return declare("Ti.UI.PickerColumn", View, {
		
		constructor: function() {
			
		},
		
		addRow: function(row) {
			console.debug('Method "Titanium.UI.PickerColumn#.addRow" is not implemented yet.');
		},
		
		removeRow: function(row) {
			console.debug('Method "Titanium.UI.PickerColumn#.removeRow" is not implemented yet.');
		},
		
		constants: {
			rowCount: {
				get: function(value) {
					console.debug('Property "Titanium.UI.PickerColumn#.rowCount" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.PickerColumn#.rowCount" is not implemented yet.');
					return value;
				}
			},
			
			rows: {
				get: function(value) {
					console.debug('Property "Titanium.UI.PickerColumn#.rows" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.PickerColumn#.rows" is not implemented yet.');
					return value;
				}
			}
		}
	
	});
	
});