define(["Ti/_/declare", "Ti/UI/View", "Ti/_/style", "Ti/_/lang","Ti/UI/MobileWeb/TableViewSeparatorStyle"], 
	function(declare, View, style, lang, TableViewSeparatorStyle) {

	var set = style.set,
		is = require.is,
		isDef = require.isDef;
		
	return declare("Ti.UI.TableView", View, {
		
		constructor: function(args) {
			
			// Content must go in a separate container so the scrollbar can exist outside of it
			var contentContainer = this._contentContainer = Ti.UI.createView({
				width: "100%",
				height: "100%",
				left: 0,
				top: 0,
				layout: 'vertical'
			});
			this.add(contentContainer);
			set(contentContainer.domNode,"overflow","hidden");
			
			// Use horizontal layouts so that the default location is always (0,0)
			contentContainer.add(this._header = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			contentContainer.add(this._sections = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			contentContainer.add(this._footer = Ti.UI.createView({height: 'auto', layout: 'vertical'}));
			
			this.data = [];
			
			this._createVerticalScrollBar();
			
			var self = this;
			function getContentHeight() {
				return self._header._measuredHeight + self._sections._measuredHeight + self._footer._measuredHeight;
			}
			
			// Handle scrolling
			var previousTouchLocation;
			this.addEventListener("touchstart",function(e) {
				previousTouchLocation = e.y;
				
				this._startScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - this._measuredHeight),
				},
				{
					y: contentContainer._measuredHeight / (getContentHeight()),
				});
			});
			this.addEventListener("touchend",function(e) {
				previousTouchLocation = null;
				
				this._endScrollBars();
				
				// Create the scroll event
				this._isScrollBarActive && this.fireEvent("scrollEnd",{
					contentOffset: {x: 0, y: contentContainer.domNode.scrollTop + this._header._measuredHeight},
					contentSize: {width: this._sections._measuredWidth, height: this._sections._measuredHeight},
					size: {width: this._measuredWidth, height: this._measuredHeight},
					x: e.x,
					y: e.y
				});
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				contentContainer.domNode.scrollTop += previousTouchLocation - e.y;
				previousTouchLocation = e.y;
				
				this._updateScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - this._measuredHeight),
				});
				
				this._fireScrollEvent(e.x,e.y);
			}));
			this.domNode.addEventListener("mousewheel",function(e) {
				self._startScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - self._measuredHeight),
				},
				{
					y: contentContainer._measuredHeight / (getContentHeight()),
				});
				setTimeout(function(){
					contentContainer.domNode.scrollLeft -= e.wheelDeltaX;
					contentContainer.domNode.scrollTop -= e.wheelDeltaY;
					self._updateScrollBars({
						y: (contentContainer.domNode.scrollTop - e.wheelDeltaY) / (getContentHeight() - self._measuredHeight),
					});
					setTimeout(function(){
						self._endScrollBars();
					},10);
				},10);
			});
			
			require.on(contentContainer.domNode,"scroll",lang.hitch(this,function(e){
				if (!this._touching) {
					this._fireScrollEvent();
				}
			}));
		},
		
		_fireScrollEvent: function(x,y) {
			// Calculate the visible items
			var firstVisibleItem,
				visibleItemCount = 0,
				scrollTop = this._contentContainer.scrollTop,
				sections = this._sections.children;
			for(var i = 0; i < sections.length; i+= 2) {
				
				// Check if the section is visible
				var section = sections[i],
					sectionOffsetTop = section._measuredTop - scrollTop,
					sectionOffsetBottom = section._measuredTop + section._measuredHeight - scrollTop;
				if (sectionOffsetBottom > 0 && sectionOffsetTop < this._contentContainer._measuredHeight) {
					
					var rows = section._rows.children
					for (var j = 1; j < rows.length; j += 2) {
						var row = rows[j],
							rowOffsetTop = row._measuredTop + section._measuredTop - scrollTop,
							rowOffsetBottom = row._measuredTop + row._measuredHeight + section._measuredTop - scrollTop;
						if (rowOffsetBottom > 0 && rowOffsetTop < this._contentContainer._measuredHeight) {
							visibleItemCount++;
							if (!firstVisibleItem) {
								firstVisibleItem = row;
							}
						}
					}
				}
			}
			
			// Create the scroll event
			this._isScrollBarActive && this.fireEvent("scroll",{
				contentOffset: {x: 0, y: this._contentContainer.scrollTop},
				contentSize: {width: this._sections._measuredWidth, height: this._sections._measuredHeight},
				firstVisibleItem: firstVisibleItem,
				size: {width: this._contentContainer._measuredWidth, height: this._contentContainer._measuredHeight},
				totalItemCount: this.data.length,
				visibleItemCount: visibleItemCount,
				x: x,
				y: y
			});
		},
		
		_defaultWidth: "100%",
		_defaultHeight: "100%",
		_getContentOffset: function(){
			return {x: this._contentContainer.scrollLeft, y: this._contentContainer.scrollTop};
		},
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				e.row = this._tableViewRowClicked;
				e.rowData = this._tableViewRowClicked;
				var index = 0,
					sections = this._sections.children;
				for(var i = 0; i < sections.length; i+= 2) {
					var localIndex = sections[i]._rows.children.indexOf(this._tableViewRowClicked);
					if (localIndex !== -1) {
						index += Math.floor(localIndex / 2);
						break;
					} else {
						index += sections[i].rowCount;
					}
				}
				e.index = index;
				e.section = this._tableViewSectionClicked;
				e.searchMode = false;
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableViewRowClicked: null,
		_tableViewSectionClicked: null,
		
		_createSeparator: function() {
			return Ti.UI.createView({
				height: 1,
				width: "100%",
				backgroundColor: "white"
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
				font: {fontSize: 22}
			});
		},
		
		_refreshSections: function() {
			for (var i = 0; i < this._sections.children.length; i += 2) {
				this._sections.children[i]._refreshRows();
			}
			this._triggerLayout();
		},
		
		_calculateLocation: function(index) {
			var currentOffset = 0,
				section;
			for(var i = 0; i < this._sections.children.length; i += 2) {
				section = this._sections.children[i];
				currentOffset += section.rowCount;
				if (index < currentOffset) {
					return {
						section: section,
						localIndex: section.rowCount - (currentOffset - index)
					};
				}
			}
			
			// Handle the special case of inserting after the last element in the last section
			if (index == currentOffset) {
				return {
					section: section,
					localIndex: section.rowCount
				};
			}
		},
		
		_insert: function(value, index) {
			var location = this._calculateLocation(index);
			if (location) {
				location.section.add(value,location.localIndex);
			}
			this._refreshSections();
		},
		
		_remove: function(index) {
			var location = this._calculateLocation(index);
			if (location) {
				location.section._removeAt(location.localIndex);
			}
		},

		appendRow: function(value) {
			this._currentSection.add(value);
			this._refreshSections();
		},
		
		deleteRow: function(index) {
			this._remove(index);
		},
		
		insertRowAfter: function(index, value) {
			this._insert(value, index + 1);
		},
		
		insertRowBefore: function(index, value) {
			this._insert(value, index);
		},
		
		updateRow: function(index, row) {
			this._remove(index);
			this._insert(row, index);
		},
		
		scrollToIndex: function(index) {
			var location = this._calculateLocation(index);
			if (location) {
				this._contentContainer.scrollTop = location.section._measuredTop + location.section._rows.children[2 * location.localIndex + 1]._measuredTop;
			}
		},
		
		scrollToTop: function(top) {
			this._contentContainer.scrollTop = top;
		},
		
		properties: {
			data: {
				set: function(value) {
					if (is(value,'Array')) {
						
						// Remove all of the previous sections
						this._sections._removeAllChildren();
						
						// Convert any object literals to TableViewRow instances, and update TableViewRow instances with row info
						for (var i in value) {
							if (!isDef(value[i].declaredClass) || (value[i].declaredClass != "Ti.UI.TableViewRow" && value[i].declaredClass != "Ti.UI.TableViewSection")) {
								value[i] = Ti.UI.createTableViewRow(value[i]);
							}
						}
						
						// If there is no data, we still need to create a default section
						if (value.length == 0) {
							this._sections.add(this._currentSection = Ti.UI.createTableViewSection({_tableView: this}));
							this._sections.add(this._createSeparator());
						}
			
						// Add each element
						for (var i = 0; i < value.length; i++) {
							if (value[i].declaredClass === "Ti.UI.TableViewRow") {
								// Check if the first item is a row, meaning we need a default section
								if (i === 0) {
									this._sections.add(this._currentSection = Ti.UI.createTableViewSection({_tableView: this}));
									this._sections.add(this._createSeparator());
								}
								this._currentSection.add(value[i]);
							} else if (value[i].declaredClass === "Ti.UI.TableViewSection") {
								value[i]._tableView = this;
								this._sections.add(this._currentSection = value[i]);
								this._sections.add(this._createSeparator());
							}
						}
						this._refreshSections();
						
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
						this._footer._removeAllChildren();
						this._footer.add(this._createDecorationLabel(value));
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
			maxRowHeight: {
				post: function(value) {
					this._refreshSections();
					return value;
				},
				value: "100%"
			},
			minRowHeight: {
				post: function(value) {
					this._refreshSections();
					return value;
				},
				value: "0%"
			},
			rowHeight: {
				post: function(value) {
					this._refreshSections();
					return value;
				},
				value: "50px"
			},
			separatorColor: {
				post: function(value) {
					this._refreshSections();
					return value;
				},
				value: "lightGrey"
			},
			separatorStyle: {
				post: function(value) {
					this._refreshSections();
					return value;
				},
				value: TableViewSeparatorStyle.SINGLE_LINE
			}
		}

	});

});