define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/UI", "Ti/_/style", "Ti/_/lang"],
	function(declare, FontWidget, dom, UI, style, lang) {
		
	var setStyle = style.set,
		contentPadding = 15,
		on = require.on;

	return declare("Ti.UI.PickerColumn", FontWidget, {
		
		constructor: function() {
			var self = this,
				clickEventName = "ontouchstart" in window ? "touchend" : "click",
				upArrow = this._upArrow = dom.create("div", {
					className: "TiUIElementGradient",
					style: {
						textAlign: "center",
						position: "absolute",
						top: 0,
						height: "40px",
						left: 0,
						right: 0,
						borderBottom: "1px solid #666",
						fontSize: "28px",
						cursor: "pointer"
					},
					innerHTML: "\u2227"
				}, this.domNode);
			on(upArrow, clickEventName, function(){
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow > 0) {
					self.selectedRow = self._rows[nextRow - 1];
				} else {
					self.selectedRow = self._rows[self._rows.length - 1];
				}
			});
			
			var titleContainer = this._titleContainer = dom.create("div", {
				style: {
					position: "absolute",
					top: "50%",
					height: "1em",
					width: "100%",
					marginTop: "-0.5em",
					textAlign: "center"
				}
			}, this.domNode);
			this._addStyleableDomNode(titleContainer);
			
			var titleClickArea = dom.create("div", {
				style: {
					position: "absolute",
					top: "40px",
					bottom: "40px",
					width: "100%"
				}
			}, this.domNode);
			on(titleClickArea, clickEventName, function() {
				// Create the window and a background to dim the current view
				var listWindow = UI.createWindow();
				var dimmingView = UI.createView({
					backgroundColor: "black",
					opacity: 0,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				});
				listWindow._add(dimmingView);
				
				// Create the list dialog itself
				var listDialog = UI.createView({
					width: "75%",
					height: UI.SIZE,
					backgroundColor: "white",
					layout: UI._LAYOUT_CONSTRAINING_VERTICAL,
					borderRadius: 3,
					opacity: 0
				});
				listWindow._add(listDialog);
				
				// Create the table rows
				var rows = self._rows,
					data = [],
					selectedRowIndex = 0;
				for(var i in rows) {
					var row = rows[i],
						isSelectedRow = row === self.selectedRow;
					data.push({
						title: row.title,
						hasCheck: isSelectedRow
					});
					isSelectedRow && (selectedRowIndex = parseInt(i));
				}
				
				// Add the table to the dialog
				var listTable = UI.createTableView({
					left: 5,
					right: 5,
					top: 5,
					height: data.length < 10 ? UI.SIZE : "70%",
					data: data
				});
				listDialog._add(listTable);
				listTable.addEventListener("singletap", function(e) {
					e.index in self._rows && (self.selectedRow = self._rows[e.index]);
					listWindow.close();
				});
				
				// Add a cancel button
				var cancelButton = UI.createButton({
					left: 5,
					top: 5,
					right: 5,
					title: "Cancel"
				});
				listDialog._add(cancelButton);
				cancelButton.addEventListener("singletap", function() {
					listWindow.close();
				});
				
				// Add a view to handle padding since there is no TI API to do it
				listDialog._add(UI.createView({ height: "5px" }));
				
				// Show the options dialog
				listWindow.open();
				
				// Animate the background after waiting for the first layout to occur
				setTimeout(function(){
					dimmingView.animate({
						opacity: 0.5,
						duration: 200
					}, function(){
						listDialog.animate({
							opacity: 1,
							duration: 200
						}, function() {
							listTable.scrollToIndex(selectedRowIndex);
						});
					});
				},30);
			});
			
			var downArrow = this._downArrow = dom.create("div", {
				className: "TiUIElementGradient",
				style: {
					textAlign: "center",
					position: "absolute",
					bottom: "0px",
					height: "40px",
					width: "100%",
					borderTop: "1px solid #666",
					fontSize: "28px",
						cursor: "pointer"
				}
			}, this.domNode);
			downArrow.innerHTML = "\u2228";
			on(downArrow, clickEventName, function() {
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow < self._rows.length - 1) {
					self.selectedRow = self._rows[nextRow + 1];
				} else {
					self.selectedRow = self._rows[0];
				}
			});
			this._rows = [];
		},
		
		_setCorners: function(left, right, radius) {
			setStyle(this._upArrow, "borderTopLeftRadius", left ? radius : "0px");
			setStyle(this._downArrow, "borderBottomLeftRadius", left ? radius : "0px");
			setStyle(this._upArrow, "borderTopRightRadius", right ? radius : "0px");
			setStyle(this._downArrow, "borderBottomRightRadius", right ? radius : "0px");
			this.borderWidth = [0, right ? 0 : 1, 0, 0];
			this.borderColor = "#666";
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_preLayout: function() {
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			return true;
		},
		
		_getContentSize: function(width, height) {
			var titleContainer = this._titleContainer;
				text = titleContainer.innerHTML;
			return {
				width: Math.max(this._widestRowWidth + contentPadding, 100),
				height: this._tallestRowHeight + contentPadding + this._upArrow.clientHeight + this._downArrow.clientHeight
			};
		},
		
		_widestRowWidth: 0,
		
		_tallestRowHeight: 0,
		
		_updateContentWidth: function() {
			var widestRowWidth = 0,
				i = 0,
				len = this._rows.length;
			for(; i < len; i++) {
				var row = this._rows[i];
				widestRowWidth = Math.max(widestRowWidth, row._measureText(row.title, row.domNode).width);
			}
			if (this._widestRowWidth !== widestRowWidth) {
				this._widestRowWidth = widestRowWidth;
			}
		},
		
		_getTallestRowHeight: function() {
			var widestRowWidth = 0,
				tallestRowHeight = 0,
				i = 0,
				len = this._rows.length;
			for(; i < len; i++) {
				var row = this._rows[i];
				tallestRowHeight = Math.max(tallestRowHeight, row._measureText(row.title, row.domNode).height);
			}
			return tallestRowHeight;
		},
		
		_setTallestRowHeight: function(height) {
			if (this._tallestRowHeight !== height) {
				this._tallestRowHeight = height;
				this._triggerLayout();
			}
		},
		
		addRow: function(row) {
			this._rows.push(row);
			row._parentColumn = this;
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			if (!this.selectedRow) {
				this.selectedRow = row;
			}
			this._publish(row);
		},
		
		removeRow: function(row) {
			var rowIndex = this._rows.indexOf(row);
			if (rowIndex !== -1) {
				this._rows.splice(rowIndex,1);
				row._parentColumn = void 0;
				this._updateContentWidth();
				this._parentPicker && this._parentPicker._updateColumnHeights();
				if (this.selectedRow === row) {
					this.selectedRow = this._rows[0];
				}
			}
			this._unpublish(row);
		},
		
		constants: {
			
			rowCount: {
				get: function() {
					return this._rows.length;
				}
			},
			
			rows: {
				get: function() {
					return this._rows;
				}
			}
			
		},
		
		properties: {
			
			selectedRow: {
				set: function(value) {
					if (!value) {
						this.font = void 0;
						this.color = void 0;
						this._titleContainer.innerHTML = "";
						this._hasSizeDimensions() && this._triggerLayout();
					} else {
						var rowIndex = this._rows.indexOf(value);
						if (rowIndex === -1) {
							return;
						}
						this.font = value.font;
						this.color = lang.val(value.color, "");
						this._titleContainer.innerHTML = value.title;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				post: function(value) {
					this.fireEvent("change", {
						column: this,
						rowIndex: this._rows.indexOf(value),
						row: value,
						value: value && value.title
					});
				}
			}
			
		}
	
	});
	
});