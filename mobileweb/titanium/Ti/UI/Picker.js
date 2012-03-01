define(["Ti/_/declare", "Ti/UI/View", "Ti/_/UI/Widget", "Ti/UI", "Ti/_/lang", "Ti/_/dom", "Ti/_/ready"],
	function(declare, View, Widget, UI, lang, dom, ready) {
		
	var is = require.is,
		undef,
		borderRadius = 6,
		unitizedBorderRadius = dom.unitize(borderRadius),
		inputSizes = {},
		DateTimeInput = declare(Widget, {
			
			constructor: function() {
				var input = this._input = dom.create("input", {
					style: {
						left: unitizedBorderRadius,
						top: unitizedBorderRadius,
						right: unitizedBorderRadius,
						bottom: unitizedBorderRadius,
						position: "absolute"
					}
				}, this.domNode);
				var currentValue = this._input.value,
					self = this;
				function handleChange() {
					if (currentValue !== input.value) {
						currentValue = input.value;
						self.fireEvent("change", {
							value: input.valueAsDate
						});
					}
				}
				this._input.addEventListener("click", function(e) {
					handleChange();
				});
				this._input.addEventListener("keyup", function(e) {
					handleChange();
				});
			},
			
			_doLayout: function(originX, originY, parentWidth, parentHeight, defaultHorizontalAlignment, defaultVerticalAlignment, isParentAutoWidth, isParentAutoHeight) {
				this.properties.__values__.width = isParentAutoWidth ? "auto" : "100%";
				this.properties.__values__.height = isParentAutoHeight ? "auto" : "100%";
				Widget.prototype._doLayout.apply(this,arguments);
			},
		
			_getContentSize: function(width, height) {
				return inputSizes[this.type];
			},
			
			properties: {
				type: {
					set: function(value) {
						this._input.type = value;
						return value;
					}
				},
				min: {
					set: function(value) {
						this._input.min = lang.val(value,"");
						return value;
					}
				},
				max: {
					set: function(value) {
						this._input.max = lang.val(value,"");
						return value;
					}
				}
			}
		});
	
	ready(function() {
		var inputRuler = dom.create("input", {
			style: {
				height: "auto",
				width: "auto"
			}
		}, document.body);
		
		var types = ["Date", "Time", "DateTime"];
		for (var i in types) {
			var type = types[i];
			inputRuler.type = type;
			inputSizes[type] = {
				width: inputRuler.clientWidth + 2 * borderRadius,
				height: inputRuler.clientHeight + 2 * borderRadius
			};
		}
		
		dom.detach(inputRuler);
	});

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
				column._setCorners(i === 0, i === numColumns - 1, unitizedBorderRadius);
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
				set: function(value) {
					this._dateTimeInput && (this._dateTimeInput.max = value);
					return value;
				}
			},
			
			minDate: {
				set: function(value) {
					this._dateTimeInput && (this._dateTimeInput.min = value);
					return value;
				}
			},
			
			type: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this.columns = undef;
						this._dateTimeInput = null;
						var self = this;
						function createInput(inputType) {
							var dateTimeInput = self._dateTimeInput = new DateTimeInput({
								type: inputType
							});
							dateTimeInput.addEventListener("change", function(e) {
								self.fireEvent("change",e);
							});
							dateTimeInput.min = self.min;
							dateTimeInput.max = self.max;
							View.prototype.add.call(self,dateTimeInput);
						}
						switch(value) {
							case Ti.UI.PICKER_TYPE_DATE:
								createInput("Date");
								break;
							case Ti.UI.PICKER_TYPE_TIME:
								createInput("Time");
								break;
							case Ti.UI.PICKER_TYPE_DATE_AND_TIME: 
								createInput("DateTime");
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