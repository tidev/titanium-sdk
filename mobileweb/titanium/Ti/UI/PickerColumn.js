define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/UI", "Ti/_/style", "Ti/_/lang"],
	function(declare, FontWidget, dom, UI, style, lang) {
		
	var setStyle = style.set,
		contentPadding = 15,
		undef;

	return declare("Ti.UI.PickerColumn", FontWidget, {
		
		constructor: function() {
			var self = this,
				upArrow = this._upArrow = dom.create("div", {
				className: "TiUIElementGradient",
				style: {
					textAlign: "center",
					position: "absolute",
					top: "0px",
					height: "40px",
					width: "100%",
					borderBottom: "1px solid #666",
					fontSize: "28px"
				}
			}, this.domNode);
			upArrow.innerHTML = "\u2227";
			upArrow.addEventListener("click", function(){
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow > 0) {
					self.selectedRow = self._rows[nextRow - 1];
				}
			});
			
			this._titleContainer = dom.create("div", {
				style: {
					position: "absolute",
					top: "50%",
					height: "1em",
					width: "100%",
					marginTop: "-0.5em",
					textAlign: "center"
				}
			}, this.domNode);
			this._addStyleableDomNode(this._titleContainer);
			
			var downArrow = this._downArrow = dom.create("div", {
				className: "TiUIElementGradient",
				style: {
					textAlign: "center",
					position: "absolute",
					bottom: "0px",
					height: "40px",
					width: "100%",
					borderTop: "1px solid #666",
					fontSize: "28px"
				}
			}, this.domNode);
			downArrow.innerHTML = "\u2228";
			downArrow.addEventListener("click", function(){
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow < self._rows.length - 1) {
					self.selectedRow = self._rows[nextRow + 1];
				}
			});
			this._rows = [];
		},
		
		_setCorners: function(left, right, radius) {
			setStyle(this._upArrow, "borderTopLeftRadius", left ? radius : "0px");
			setStyle(this._downArrow, "borderBottomLeftRadius", left ? radius : "0px");
			setStyle(this._upArrow, "borderTopRightRadius", right ? radius : "0px");
			setStyle(this._downArrow, "borderBottomRightRadius", right ? radius : "0px");
			setStyle(this.domNode,"borderRight", right ? "" : "1px solid #666");
		},
		
		_doLayout: function() {
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			FontWidget.prototype._doLayout.apply(this,arguments);
		},
		
		_getContentSize: function(width, height) {
			var titleContainer = this._titleContainer;
				text = titleContainer.innerHTML;
			return {
				width: width === "auto" ? Math.max(this._widestRowWidth + contentPadding, 100) : width,
				height: height === "auto" ? this._tallestRowHeight + contentPadding + this._upArrow.clientHeight + this._downArrow.clientHeight : height
			};
		},
		
		_widestRowWidth: 0,
		
		_tallestRowHeight: 0,
		
		_updateContentWidth: function() {
			if (this._hasAutoDimensions()) {
				var widestRowWidth = 0;
				for(var i in this._rows) {
					var row = this._rows[i];
					widestRowWidth = Math.max(widestRowWidth, row._measureText(row.title, row.domNode).width);
				}
				if (this._widestRowWidth !== widestRowWidth) {
					this._widestRowWidth = widestRowWidth;
					this._triggerParentLayout();
				}
			}
		},
		
		_getTallestRowHeight: function() {
			if (this._hasAutoDimensions()) {
				var widestRowWidth = 0,
					tallestRowHeight = 0;
				for(var i in this._rows) {
					var row = this._rows[i];
					tallestRowHeight = Math.max(tallestRowHeight, row._measureText(row.title, row.domNode).height);
				}
				return tallestRowHeight;
			}
		},
		
		_setTallestRowHeight: function(height) {
			if (this._tallestRowHeight !== height) {
				this._tallestRowHeight = height;
				this._triggerParentLayout();
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
		},
		
		removeRow: function(row) {
			var rowIndex = this._rows.indexOf(row);
			if (rowIndex !== -1) {
				this._rows.splice(rowIndex,1);
				row._parentColumn = undef;
				this._updateContentWidth();
				this._parentPicker && this._parentPicker._updateColumnHeights();
				if (this.selectedRow === row) {
					this.selectedRow = this._rows[0];
				}
			}
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
						this.font = undef;
						this.color = undef;
						this._titleContainer.innerHTML = "";
						this._hasAutoDimensions() && this._triggerParentLayout();
					} else {
						if (this._rows.indexOf(value) === -1) {
							return;
						}
						this.font = value.font;
						this.color = lang.val(value.color, "");
						this._titleContainer.innerHTML = value.title;
						this._hasAutoDimensions() && this._triggerParentLayout();
					}
					return value;
				}
			}
			
		}
	
	});
	
});