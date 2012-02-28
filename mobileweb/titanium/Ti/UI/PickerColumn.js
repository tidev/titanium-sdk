define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/UI"],
	function(declare, View, dom, UI) {

	return declare("Ti.UI.PickerColumn", View, {
		
		constructor: function() {
			this.add(this._contents = UI.createScrollView({
				layout: "vertical",
				contentWidth: "100%"
			}));
		},
		
		addRow: function(row) {
			this._contents.add(row);
		},
		
		removeRow: function(row) {
			console.debug('Method "Titanium.UI.PickerColumn#.removeRow" is not implemented yet.');
		},
		
		_getSelectedRow: function() {
			console.debug('Method "Titanium.UI.PickerColumn#._getSelectedRow" is not implemented yet.');
		},
		
		_setSelectedRow: function(row) {
			console.debug('Method "Titanium.UI.PickerColumn#._setSelectedRow" is not implemented yet.');
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