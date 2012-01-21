define("Ti/UI/TableView", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang"], function(declare, View, dom, css, style, lang) {

	var set = style.set,
		is = require.is,
		isDef = require.isDef,
		undef;

	return declare("Ti.UI.TableView", View, {
		
		constructor: function(args) {
			
			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = 'vertical';
			set(this.domNode,"overflow-x","hidden");
			set(this.domNode,"overflow-y","auto");
			
			// Use horizontal layouts so that the default location is always (0,0)
			this.header = Ti.UI.createView({height: 'auto', layout: 'horizontal'});
			this.rows = Ti.UI.createView({height: 'auto', layout: 'vertical'});
			this.rows.add(Ti.UI.createView({height: "1px", width: "100%", backgroundColor: this.separatorColor}));
			this.footer = Ti.UI.createView({height: 'auto', layout: 'horizontal'});
			
			this.add(this.header);
			this.add(this.rows);
			this.add(this.footer);
			
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
				})
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				this.domNode.scrollTop += previousTouchLocation - e.y;
				previousTouchLocation = e.y;
				
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
					x: e.x,
					y: e.y
				})
			}));
		},
		
		_createSeparator: function() {
			
		},

		appendRow: function(row, properties) {
			this.insertRowAfter(this.data.length - 1,row,properties);
		},
		deleteRow: function(row, properties) {
			console.debug('Property "Titanium.UI.TableView#.deleteRow" is not implemented yet.');
		},
		insertRowAfter: function(index, row, properties) {
			data.splice(index + 1,0,row);
		},
		insertRowBefore: function(index, row, properties) {
			data.splice(index,0,row);
			this.rows._insertAt(Ti.UI)
			this.rows._insertAt(row, index);
		},
		updateRow: function(row, properties) {
			console.debug('Property "Titanium.UI.TableView#.updateRow" is not implemented yet.');
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
						
						// Add the new children
						for (var i in value) {
							this.rows
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
				set: function(value) {
					console.debug('Property "Titanium.UI.TableView#.separatorColor" is not implemented yet.');
					return value;
				},
				value: "lightGrey"
			},
			separatorStyle: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableView#.separatorStyle" is not implemented yet.');
					return value;
				}
			}
		}

	});

});