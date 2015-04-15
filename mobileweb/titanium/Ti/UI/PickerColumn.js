define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/UI", 'Ti/_/has', "Ti/_/style", "Ti/_/lang"],
	function(declare, FontWidget, dom, UI, has, style, lang) {

	var setStyle = style.set,
		contentPadding = 15,
		on = require.on;

	return declare("Ti.UI.PickerColumn", FontWidget, {

		constructor: function() {
			var self = this,
				clickEventName = has('touch') ? "touchend" : "click",
				node = self.domNode,
				rows = self.__values__.constants.rows = [],
				upArrow = self._upArrow = dom.create("div", {
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
				}, node),
				titleContainer = self._titleContainer = dom.create("div", {
					style: {
						position: "absolute",
						top: "50%",
						height: "1em",
						width: "100%",
						marginTop: "-0.5em",
						textAlign: "center"
					}
				}, node),
				titleClickArea = dom.create("div", {
					style: {
						position: "absolute",
						top: "40px",
						bottom: "40px",
						width: "100%"
					}
				}, node),
				downArrow = self._downArrow = dom.create("div", {
					className: "TiUIElementGradient",
					innerHTML: "\u2228",
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
				}, node);

			self._addStyleableDomNode(titleContainer);

			this._handles = [
				on(upArrow, clickEventName, function() {
					var nextRow = rows.indexOf(self.selectedRow);
					if (nextRow > 0) {
						self.selectedRow = rows[nextRow - 1];
					} else {
						self.selectedRow = rows[rows.length - 1];
					}
				}),
				on(titleClickArea, clickEventName, function() {
					// Create the window and a background to dim the current view
					var listWindow = UI.createWindow(),
						dimmingView = UI.createView({
							backgroundColor: "#000",
							opacity: 0,
							left: 0,
							top: 0,
							right: 0,
							bottom: 0
						}),
						listDialog = UI.createView({
							width: "75%",
							height: UI.SIZE,
							backgroundColor: "#fff",
							layout: UI._LAYOUT_CONSTRAINING_VERTICAL,
							borderRadius: 3,
							opacity: 0
						}),
						selectedRowIndex = 0,
						tmp = 0,
						data = rows.map(function(row) {
							var isSelectedRow = row === self.selectedRow;
							isSelectedRow && (selectedRowIndex = parseInt(tmp++));
							return {
								title: row.title,
								hasCheck: isSelectedRow
							};
						}),
						listTable = UI.createTableView({
							left: 5,
							right: 5,
							top: 5,
							height: data.length < 10 ? UI.SIZE : "70%",
							data: data
						}),
						cancelButton = UI.createButton({
							left: 5,
							top: 5,
							right: 5,
							title: "Cancel"
						});

					listTable.addEventListener("singletap", function(e) {
						e.index in rows && (self.selectedRow = rows[e.index]);
						listWindow.close();
					});

					cancelButton.addEventListener("singletap", function() {
						listWindow.close();
					});

					listWindow._add(dimmingView);
					listWindow._add(listDialog);

					listDialog._add(listTable);
					listDialog.add(cancelButton);

					// Add a view to handle padding since there is no TI API to do it
					listDialog._add(UI.createView({ height: "5px" }));

					// Show the options dialog
					listWindow.open();

					// Animate the background after waiting for the first layout to occur
					setTimeout(function() {
						dimmingView.animate({
							opacity: 0.5,
							duration: 200
						}, function() {
							listDialog.animate({
								opacity: 1,
								duration: 200
							}, function() {
								listTable.scrollToIndex(selectedRowIndex);
							});
						});
					}, 30);
				}),
				on(downArrow, clickEventName, function() {
					var nextRow = rows.indexOf(self.selectedRow);
					if (nextRow < rows.length - 1) {
						self.selectedRow = rows[nextRow + 1];
					} else {
						self.selectedRow = rows[0];
					}
				})
			];
		},

		destroy: function() {
			event.off(this._handles);
			FontWidget.prototype.destroy.apply(this, arguments);
		},

		_setCorners: function(left, right, radius) {
			setStyle(this._upArrow, {
				borderTopLeftRadius: left ? radius : "0px",
				borderTopRightRadius: right ? radius : "0px"
			});
			setStyle(this._downArrow, {
				borderBottomLeftRadius: left ? radius : "0px",
				borderBottomRightRadius: right ? radius : "0px"
			});
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

		_getContentSize: function() {
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
				len = this.rows.length,
				row;
			while (i < len) {
				row = this.rows[i++];
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
				len = this.rows.length;
			for(; i < len; i++) {
				var row = this.rows[i];
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
			this.rows.push(row);
			row._parentColumn = this;
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			if (!this.selectedRow) {
				this.selectedRow = row;
			}
			this._publish(row);
		},

		removeRow: function(row) {
			var rowIndex = this.rows.indexOf(row);
			if (rowIndex !== -1) {
				this.rows.splice(rowIndex, 1);
				row._parentColumn = void 0;
				this._updateContentWidth();
				this._parentPicker && this._parentPicker._updateColumnHeights();
				if (this.selectedRow === row) {
					this.selectedRow = this.rows[0];
				}
			}
			this._unpublish(row);
		},

		constants: {
			rowCount: {
				get: function() {
					return this.rows.length;
				}
			},
			rows: void 0
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
						var rowIndex = this.rows.indexOf(value);
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
						rowIndex: this.rows.indexOf(value),
						row: value,
						value: value && value.title
					});
				}
			}
		}

	});

});