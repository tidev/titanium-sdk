define(["Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/lang"],
	function(declare, View, UI, lang) {
		
	var is = require.is,
		undef;

	return declare("Ti.UI.Picker", View, {
		
		constructor: function() {
			this.layout = "horizontal";
			this._layout._defaultVerticalAlignment = "center";
			this._columns = [];
		},
		
		_currentColumn: null,
		
		_addColumn: function(column) {
			this._columns.push(column);
			column._parentPicker = this;
			var numColumns = this._columns.length,
				width = this.width === "auto" ? "auto" : 100 / numColumns + "%",
				height = this.height === "auto" ? "auto" : "100%";
			for (var i = 0; i < numColumns; i++) {
				var column = this._columns[i];
				column.width = width;
				column.height = height;
				column._setCorners(i === 0, i === numColumns - 1, "6px");
			}
			column._pickerChangeEventListener = lang.hitch(this,function(e) {
				var eventInfo = {
					column: e.column,
					columnIndex: this._columns.indexOf(e.column),
					row: e.row,
					rowIndex: e.rowIndex
				};
				if (this.type === Ti.UI.PICKER_TYPE_PLAIN) {
					var selectedValue = []
					for(var i in this._columns) {
						var selectedRow = this._columns[i].selectedRow;
						selectedRow && selectedValue.push(selectedRow.title);
					}
					eventInfo.selectedValue = selectedValue;
				} else {
					
				}
				this.fireEvent("change", eventInfo);
			});
			column.addEventListener("change", column._pickerChangeEventListener);
			View.prototype.add.call(this,column);
		},
		
		_updateColumnHeights: function() {
			var tallestColumnHeight = 0;
			for(var i in this._columns) {
				tallestColumnHeight = Math.max(tallestColumnHeight, this._columns[i]._getTallestRowHeight());
			}
			for(var i in this._columns) {
				this._columns[i]._setTallestRowHeight(tallestColumnHeight);
			}
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
		
		getSelectedRow: function(columnIndex) {
			var column = this._columns[columnIndex];
			return column && column.selectedRow;
		},
		
		setSelectedRow: function(columnIndex, rowIndex) {
			var column = this._columns[columnIndex];
			column && (column.selectedRow = column.rows[rowIndex]);
		},
		
		properties: {
			columns: {
				get: function(value) {
					return this._columns;
				},
				set: function(value) {
					
					// Remove the existing columns
					this._removeAllChildren();
					for(var i in this._columns) {
						var column = this._columns[i];
						column.removeEventListener(column._pickerChangeEventListener);
						column._parentPicker = undef;
					}
					this._columns = [];
					
					// Add the new column(s)
					value && this.add(value);
					
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
			
			type: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this.columns = undef;
						switch(value) {
							case Ti.UI.PICKER_TYPE_DATE:
								break;
							case Ti.UI.PICKER_TYPE_TIME: 
								break;
							default: 
								break;
						}
					}
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