define("Ti/UI/TableView", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang","Ti/UI/MobileWeb/TableViewSeparatorStyle"], 
	function(declare, View, dom, css, style, lang, TableViewSeparatorStyle) {

	var set = style.set,
		is = require.is,
		isDef = require.isDef;

	return declare("Ti.UI.TableView", View, {
		
		constructor: function(args) {
			
			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = 'vertical';
			set(this.domNode,"overflow-x","hidden");
			set(this.domNode,"overflow-y","auto");
			
			// Use horizontal layouts so that the default location is always (0,0)
			this.header = Ti.UI.createView({height: 'auto', layout: 'horizontal'});
			this.rows = Ti.UI.createView({height: 'auto', layout: 'vertical'});
			this.footer = Ti.UI.createView({height: 'auto', layout: 'horizontal'});
			
			this.add(this.header);
			this.add(this.rows);
			this.add(this.footer);
			
			this.data = [];
			
			// Handle scrolling
			var previousTouchLocation;
			this.addEventListener("touchstart",function(e) {
				previousTouchLocation = e.y;
			});
			this.addEventListener("touchend",function(e) {
				previousTouchLocation = null;
				
				// Create the scroll event
				this.fireEvent("scrollEnd",{
					contentOffset: {x: 0, y: this.domNode.scrollTop},
					contentSize: {width: this.rows._measuredWidth, height: this.rows._measuredHeight},
					size: {width: this._measuredWidth, height: this._measuredHeight},
					x: e.x,
					y: e.y
				});
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				this.domNode.scrollTop += previousTouchLocation - e.y;
				previousTouchLocation = e.y;
				
				this._fireScrollEvent(e.x,e.y);
			}));
			
			require.on(this.domNode,"scroll",lang.hitch(this,function(e){
				if (!this._touching) {
					this._fireScrollEvent();
				}
			}));
		},
		
		_fireScrollEvent: function(x,y) {
			// Calculate the visible items
			var firstVisibleItem,
				visibleItemCount = 1,
				scrollTop = this.domNode.scrollTop;
			for(var i = 0; i < this.data.length; i++) {
				var row = this.data[i];
				if (firstVisibleItem) {
					if (row._measuredTop - scrollTop < this._measuredHeight) {
						visibleItemCount++;
					}
				} else if (row._measuredTop <= scrollTop && row._measuredTop + row._measuredHeight > scrollTop) {
					firstVisibleItem = row;
				}
			}
			
			// Create the scroll event
			this.fireEvent("scroll",{
				contentOffset: {x: 0, y: this.domNode.scrollTop},
				contentSize: {width: this.rows._measuredWidth, height: this.rows._measuredHeight},
				firstVisibleItem: firstVisibleItem,
				size: {width: this._measuredWidth, height: this._measuredHeight},
				totalItemCount: this.data.length,
				visibleItemCount: visibleItemCount,
				x: x,
				y: y
			});
		},
		
		_createSeparator: function() {
			var showSeparator = this.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE;
			return Ti.UI.createView({
				height: showSeparator ? 1 : 0,
				width: "100%",
				backgroundColor: showSeparator ? this.separatorColor : "transparent"
			});
		},
		
		_updateSeparators: function(color,style) {
			var children = this.rows.children;
			for (var i = 0; i < children.length; i += 2) {
				var child = children[i];
				if (style === TableViewSeparatorStyle.SINGLE_LINE) {
					child.height = 1;
					child.backgroundColor = color;
				} else {
					child.height = 0;
					child.backgroundColor = "transparent";
				}
			}
		},

		appendRow: function(value) {
			this.insertRowBefore(this.data.length, value);
		},
		
		deleteRow: function(index) {
			
			if (index < 0 || index >= this.data.length) {
				return;
			}
			
			var view = this.data.splice(index,1),
				rows = this.rows;
			rows.remove(view[0]);
			rows.remove(view[0]._separator);
			
			if (this.data.length === 0) {
				rows.remove(rows.children[0]);
			}
		},
		
		insertRowAfter: function(index, value) {
			index++;
			if (is(value,"Array")) {
				for (var i = 0; i < value.length; i++) {
					this._insertHelper(value[i], index++);
				}
			} else {
				this._insertHelper(value, index);
			}
		},
		
		insertRowBefore: function(index, value) {
			if (is(value,"Array")) {
				for (var i = 0; i < value.length; i++) {
					this._insertHelper(value[i], index++);
				}
			} else {
				this._insertHelper(value, index);
			}
		},
		
		_insertHelper: function(view, index) {
			
			var rows = this.rows,
				data = this.data;
			if (index < 0 || index > data.length) {
				return;
			}
			
			if (data.length === 0) {
				rows.add(this._createSeparator());
			}
			
			if (!isDef(view.declaredClass) || view.declaredClass != "Ti.UI.TableViewRow") {
				view = Ti.UI.createTableViewRow(view);
			}
			
			view._separator = this._createSeparator();
			if (index == data.length) {
				data.push(view);
				rows.add(view);
				rows.add(view._separator);
			} else {
				data.splice(index,0,view);
				rows._insertAt(view,2 * index + 1);
				rows._insertAt(view._separator,2 * index + 2);
			}
		},
		
		updateRow: function(index, row) {
			if (index < 0 || index >= this.data.length) {
				return;
			}
			this.deleteRow(index);
			this.insertRowBefore(index,row);
		},
		
		scrollToIndex: function(index) {
			var control = this.data[index];
			if (control) {
				this.domNode.scrollTop = control._measuredTop;
			}
		},
		
		scrollToTop: function(top) {
			this.domNode.scrollTop = top;
		},
		
		doLayout: function() {
			
			// Update the row height info
			for (var i in this.data) {
				var row = this.data[i];
				if (isDef(row.declaredClass) && row.declaredClass == "Ti.UI.TableViewRow") {
					row._defaultHeight = this.rowHeight;
					set(row.domNode,'minHeight',this.minRowHeight);
					set(row.domNode,'maxHeight',this.maxRowHeight);
				}
			}
			
			View.prototype.doLayout.apply(this,arguments);
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",
		_getContentOffset: function(){
			return {x: this.domNode.scrollLeft, y: this.domNode.scrollTop};
		},
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				e.row = this._tableViewRowClicked;
				e.rowData = this._tableViewRowClicked;
				e.index = this.rows.children.indexOf(this._tableViewRowClicked);
				e.section = this._tableViewSectionClicked;
				e.searchMode = false;
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableViewRowClicked: null,
		_tableViewSectionClicked: null,
		
		properties: {
			data: {
				set: function(value) {
					if (is(value,'Array')) {
						
						// Remove all of the previous children
						for(var i in this.rows.children) {
							this.rows.remove(this.rows.children[i]);
						}
						
						// Convert any object literals to TableViewRow instances, and update TableViewRow instances with row info
						for (var i in value) {
							if (!isDef(value[i].declaredClass) || value[i].declaredClass != "Ti.UI.TableViewRow") {
								value[i] = Ti.UI.createTableViewRow(value[i]);
							}
						}
						
						// Add the first separator
						this.rows.add(this._createSeparator());
						
						// Add the new children
						for (var i in value) {
							this.rows.add(value[i]);
							value[i]._separator = this._createSeparator();
							this.rows.add(value[i]._separator);
						}
						
						// Relayout the screen
						Ti.UI._doFullLayout();
						
						return value;
					} else {
						// Data must be an array
						return;
					}
				}
			},
			footerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this.footerTitleControl && this.footer.remove(this.footerTitleControl);
						this.footerTitleControl = Ti.UI.createLabel({text: value});
						this.footer.add(this.footerTitleControl);
						Ti.UI._doFullLayout();
					}
					return value;
				}
			},
			footerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this.footerTitleControl && this.footer.remove(this.footerTitleControl);
						this.footerTitleControl = value;
						this.footer.add(this.footerTitleControl);
						Ti.UI._doFullLayout();
					}
					return value;
				}
			},
			headerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this.headerTitleControl && this.header.remove(this.headerTitleControl);
						this.headerTitleControl = Ti.UI.createLabel({text: value});
						this.header.add(this.headerTitleControl);
						Ti.UI._doFullLayout();
					}
					return value;
				}
			},
			headerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this.headerTitleControl && this.header.remove(this.headerTitleControl);
						this.headerTitleControl = value;
						this.header.add(this.headerTitleControl);
						Ti.UI._doFullLayout();
					}
					return value;
				}
			},
			maxRowHeight: "100%",
			minRowHeight: "0%",
			rowHeight: "50px",
			separatorColor: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this._updateSeparators(value,this.separatorStyle);
					}
					return value;
				},
				value: "lightGrey"
			},
			separatorStyle: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this._updateSeparators(this.separatorColor,value);
					}
					return value;
				},
				value: TableViewSeparatorStyle.SINGLE_LINE
			}
		}

	});

});