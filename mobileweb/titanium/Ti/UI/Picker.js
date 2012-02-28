define(["Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/lang"],
	function(declare, View, UI, lang) {
		
	var is = require.is;

	return declare("Ti.UI.Picker", View, {
		
		constructor: function() {
			this.layout = "horizontal";
			this._layout._defaultVerticalAlignment = "center";
			this._columns = [];
		},
		
		_currentColumn: null,
		
		_addColumn: function(column) {
			this._columns.push(column);
			var width = 100 / this._columns.length + "%";
			for (var i in this._columns) {
				this._columns[i].width = width;
			}
			View.prototype.add.call(this,column);
		},
		
		add: function(value) {
			if (is(value,"Array")) {
				for (var i in value) {
					this.add(value[i]);
				}
			} else if(lang.isDef(value.declaredClass)) {
				if (value.declaredClass === "Ti.UI.PickerColumn") {
					this._addColumn(value);
				} else if(value.declaredClass === "Ti.UI.PickerRow") {
					this._currentColumn === null && (this._addColumn(this._currentColumn = UI.createPickerColumn()));
					this._currentColumn.addRow(value);
				}
			}
		},
		
		getSelectedRow: function(index) {
			console.debug('Method "Titanium.UI.Picker#.getSelectedRow" is not implemented yet.');
		},
		
		setSelectedRow: function(column, row) {
			console.debug('Method "Titanium.UI.Picker#.setSelectedRow" is not implemented yet.');
		},
		
		properties: {
			columns: {
				get: function(value) {
					return this._columns;
				},
				set: function(value) {
					
					// Remove the existing columns
					this._removeAllChildren();
					this._columns = [];
					
					// Add the new columns
					this.add(value);
					
					// We intentionally don't return anything because we are not using the internal storage mechanism.
				}
			},
			
			maxDate: {
				get: function(value) {
					console.debug('Property "Titanium.UI.Picker#.maxDate" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Picker#.maxDate" is not implemented yet.');
					return value;
				}
			},
			
			minDate: {
				get: function(value) {
					console.debug('Property "Titanium.UI.Picker#.minDate" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Picker#.minDate" is not implemented yet.');
					return value;
				}
			},
			
			selectionIndicator: {
				get: function(value) {
					console.debug('Property "Titanium.UI.Picker#.selectionIndicator" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Picker#.selectionIndicator" is not implemented yet.');
					return value;
				}
			},
			
			type: {
				get: function(value) {
					console.debug('Property "Titanium.UI.Picker#.type" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Picker#.type" is not implemented yet.');
					return value;
				},
				value: Ti.UI.PICKER_TYPE_PLAIN
			},
			
			value: {
				get: function(value) {
					console.debug('Property "Titanium.UI.Picker#.value" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Picker#.value" is not implemented yet.');
					return value;
				}
			}
			
		}
	
	});
	
});