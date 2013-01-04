define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/Widget", "Ti/_/style","Ti/UI/MobileWeb/TableViewSeparatorStyle", "Ti/UI"], 
	function(declare, lang, Widget, style, TableViewSeparatorStyle, UI) {
	
	var on = require.on,
		emptyfn = function(){},
		is = require.is,
		setStyle = style.set;

	return declare("Ti.UI.TableViewSection", Widget, {
		
		constructor: function(args) {
			this._indexedContent = [];

			var i = 0,
				l = 3,
				a = ["_header", "_rows", "_footer"];

			while (i < l) {
				this._add(this[a[i++]] = UI.createView({
					height: UI.SIZE,
					width: UI.INHERIT,
					layout: UI._LAYOUT_CONSTRAINING_VERTICAL
				}));
			}

			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = UI._LAYOUT_CONSTRAINING_VERTICAL;

			// Force single tap and long press to be enabled.
			on(this, "singletap", emptyfn);
			on(this, "longpress", emptyfn);
		},

		_defaultWidth: UI.INHERIT,

		_defaultHeight: UI.SIZE,
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap" || type === "longpress") {
				this._tableView && (this._tableView._tableViewSectionClicked = this);
			}
			Widget.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableView: null,
		
		_createDecorationLabel: function(text) {
			return UI.createLabel({
				text: text, 
				backgroundColor: "darkGrey",
				color: "white",
				width: UI.INHERIT,
				height: UI.SIZE,
				left: 0,
				font: {fontSize: 18}
			});
		},
		
		_refreshRows: function() {
			if (this._tableView) {
				// Update the row information
				var rows = this._rows._children,
					tableView = this._tableView,
					rowsData = this.constants.rows = [];
				for (var i = 0; i < rows.length; i += 1) {
								
					var row = rows[i];
					
					row._defaultHeight = tableView.rowHeight;
					row._minHeight = tableView.minRowHeight;
					row._maxHeight = tableView.maxRowHeight;
					if (tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE) {
						setStyle(row.domNode,{borderBottom: "1px solid " + tableView.separatorColor});
					}
					
					rowsData.push(row);
				}
				
			}
		},
		
		_insertHelper: function(value, index) {
			if (!lang.isDef(value.declaredClass) || value.declaredClass != "Ti.UI.TableViewRow") {
				value = UI.createTableViewRow(value);
			}

			this._rows._insertAt(value, index);
			
			value._tableViewSection = this;

			this._refreshRows();
		},
		
		add: function(value, index) {

			var rows = this._rows._children,
				rowCount = this.rowCount;

			if (!lang.isDef(index)) {
				index = rowCount;
			}
			if (index < 0 || index > rowCount) {
				return;
			}

			if (rows.length === 0) {
				this._insertHelper(value,0);
				return;
			}			
			
			if (is(value,"Array")) {
				for (var i in value) {
					this._insertHelper(value[i],index++);
				}
			} else {
				this._insertHelper(value,index);
			}
			

		},
		
		_removeAt: function(index) {
			if (index < 0 || index >= this.rowCount) {
				return;
			}
			this._rows.remove(this._rows._children[index]); // Remove the row
			
			this._refreshRows();
		},
		
		remove: function(view) {
			var index = this._rows._children.indexOf(view);
			if (index === -1) {
				return;
			}
			
			this._removeAt(index);
		},
		
		constants: {
			rows: void 0
		},
					
		properties: {
			footerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer._add(this._createDecorationLabel(value));
					}
					return value;
				}
			},
			footerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer._add(value);
					}
					return value;
				}
			},
			headerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header._add(this._createDecorationLabel(value));
					}
					return value;
				}
			},
			headerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header._add(value);
					}
					return value;
				}
			},
			
			rowCount: function(value) {
				return this._rows._children.length;
			}
		}

	});

});