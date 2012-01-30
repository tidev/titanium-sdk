define("Ti/UI/TableViewSection", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/style","Ti/UI/MobileWeb/TableViewSeparatorStyle"], 
	function(declare, Widget, style, TableViewSeparatorStyle) {
	
	var is = require.is,
		isDef = require.isDef,
		set = style.set;

	return declare("Ti.UI.TableViewSection", Widget, {
		
		constructor: function(args) {
			
			this._indexedContent = [];
			
			Widget.prototype.add.call(this,this._header = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			Widget.prototype.add.call(this,this._rows = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			Widget.prototype.add.call(this,this._footer = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			
			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = 'vertical';
		},

		_defaultHeight: "auto",
		_defaultWidth: "100%",
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._parent && this._parent._parent && (this._parent._parent._tableViewSectionClicked = this);
			}
			Widget.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableView: null,
		
		_createSeparator: function() {
			var showSeparator = this._tableView && this._tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE;
			return Ti.UI.createView({
				height: showSeparator ? 1 : 0,
				width: "100%",
				backgroundColor: showSeparator ? this._tableView.separatorColor : "transparent"
			});
		},
		
		_createDecorationLabel: function(text) {
			return Ti.UI.createLabel({
				text: text, 
				backgroundColor: "darkGrey",
				color: "white",
				width: "100%",
				height: "auto",
				left: 0,
				font: {fontSize: 18}
			});
		},
		
		_refreshRows: function() {
			if (this._tableView) {
				// Update the row information
				var rows = this._rows.children,
					tableView = this._tableView; 
				for (var i = 1; i < rows.length; i += 2) {
					var row = rows[i];
					row._defaultHeight = tableView.rowHeight;
					set(row.domNode,'minHeight',tableView.minRowHeight);
					set(row.domNode,'maxHeight',tableView.maxRowHeight);
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
			if (!isDef(value.declaredClass) || value.declaredClass != "Ti.UI.TableViewRow") {
				value = Ti.UI.createTableViewRow(value);
			}
			
			this._rows._insertAt(value, 2 * index + 1);
			this._rows._insertAt(this._createSeparator(), 2 * index + 2);
			value._tableViewSection = this;
			this.rowCount++;
		},
		
		add: function(value, index) {
			
			var rows = this._rows.children,
				rowCount = this.rowCount;
			if (!isDef(index)) {
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
			this._rows.remove(this._rows.children[2 * index + 1]);
			this._rows.remove(this._rows.children[2 * index + 1]);
			
			// Remove the last separator, if there are no rows left
			if (this._rows.children.length === 1) {
				this._rows.remove(this._rows.children[0]);
			}
		},
		
		remove: function(view) {
			var index = this._rows.children.indexOf(view);
			if (index === -1) {
				return;
			}
			
			this._removeAt(index);
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