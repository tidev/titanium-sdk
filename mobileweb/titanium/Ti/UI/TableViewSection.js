define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/Widget", "Ti/_/style","Ti/UI/MobileWeb/TableViewSeparatorStyle", "Ti/UI"], 
	function(declare, lang, Widget, style, TableViewSeparatorStyle, UI) {
	
	var is = require.is,
		setStyle = style.set;

	return declare("Ti.UI.TableViewSection", Widget, {
		
		constructor: function(args) {
			this._indexedContent = [];

			require.each(["_header", "_rows", "_footer"], lang.hitch(this, function(v) {
				Widget.prototype.add.call(this, this[v] = UI.createView({ 
					height: UI.SIZE, 
					width: UI.INHERIT, 
					layout: "vertical"
				}));
			}));

			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = "vertical";
		},

		_defaultWidth: UI.INHERIT,

		_defaultHeight: UI.SIZE,
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._tableView && (this._tableView._tableViewSectionClicked = this);
			}
			Widget.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableView: null,
		
		_createSeparator: function() {
			var showSeparator = this._tableView && this._tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE,
				separator = UI.createView({
					height: showSeparator ? 1 : 0,
					width: UI.INHERIT,
					backgroundColor: showSeparator ? this._tableView.separatorColor : "transparent"
				});
			setStyle(separator.domNode,"minWidth","100%"); // Temporary hack until TIMOB-8124 is completed.
			return separator;
		},
		
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
				var rows = this._rows.children,
					tableView = this._tableView,
					rowsData = this.constants.rows = [];
				for (var i = 1; i < rows.length; i += 2) {
					var row = rows[i];
					row._defaultHeight = tableView.rowHeight;
					row._minHeight = tableView.minRowHeight;
					row._maxHeight = tableView.maxRowHeight;
					rowsData.push(row);
				}
				
				for (var i = 0; i < rows.length; i += 2) {
					var row = rows[i];
					if (tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE) {
						row.height = 1;
						row.backgroundColor = tableView.separatorColor;
					} else {
						row.height = 0;
						row.backgroundColor = "transparent";
					}
				}
			}
		},
		
		_insertHelper: function(value, index) {
			if (!lang.isDef(value.declaredClass) || value.declaredClass != "Ti.UI.TableViewRow") {
				value = UI.createTableViewRow(value);
			}
			
			this._rows._insertAt(value, 2 * index + 1);
			this._rows._insertAt(this._createSeparator(), 2 * index + 2);
			value._tableViewSection = this;
			this.rowCount++;
			this._refreshRows();
		},
		
		add: function(value, index) {
			
			var rows = this._rows.children,
				rowCount = this.rowCount;
			if (!lang.isDef(index)) {
				index = rowCount;
			}
			if (index < 0 || index > rowCount) {
				return;
			}
			
			if (rows.length === 0) {
				this._rows.add(this._createSeparator());
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
			this._rows.children[2 * index + 1]._tableViewSection = null;
			this._rows.remove(this._rows.children[2 * index + 1]); // Remove the separator
			this._rows.remove(this._rows.children[2 * index + 1]); // Remove the row
			
			// Remove the last separator, if there are no rows left
			if (this._rows.children.length === 1) {
				this._rows.remove(this._rows.children[0]);
			}
			this._refreshRows();
		},
		
		remove: function(view) {
			var index = this._rows.children.indexOf(view);
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
						this._footer.add(this._createDecorationLabel(value));
						this._footer.add(this._createSeparator());
					}
					return value;
				}
			},
			footerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer.add(value);
					}
					return value;
				}
			},
			headerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(this._createDecorationLabel(value));
						this._header.add(this._createSeparator());
					}
					return value;
				}
			},
			headerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(value);
					}
					return value;
				}
			},
			
			rowCount: function(value) {
				return Math.floor(this._rows.children.length / 2);
			}
		}

	});

});