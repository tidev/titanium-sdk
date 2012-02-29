define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/UI", "Ti/_/style"],
	function(declare, View, dom, UI, style) {
		
	var setStyle = style.set;

	return declare("Ti.UI.PickerColumn", View, {
		
		constructor: function() {
			this._upArrow = dom.create("div", {
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
			this._upArrow.innerHTML = "\u2227";
			
			this._content = dom.create("div", {
				style: {
					position: "absolute",
					top: "50%",
					height: "1em",
					width: "100%",
					marginTop: "-0.5em",
					textAlign: "center"
				}
			}, this.domNode);
			this._content.innerHTML = "Helloy"
			
			this._downArrow = dom.create("div", {
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
			this._downArrow.innerHTML = "\u2228";
		},
		
		_setRightBorder: function() {
			setStyle(this.domNode,"borderRight","1px solid #666");
		},
		
		addRow: function(row) {
			
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