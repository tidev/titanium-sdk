define("Ti/UI/TableView", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

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
			this.add(this.header);
			
			this.rows = Ti.UI.createView({height: 'auto', layout: 'vertical'});
			this.add(this.rows);
			
			this.footer = Ti.UI.createView({height: 'auto', layout: 'horizontal'});
			this.add(this.footer);
		},

		appendRow: function(row, properties) {
			console.debug('Property "Titanium.UI.TableView#.appendRow" is not implemented yet.');
		},
		deleteRow: function(row, properties) {
			console.debug('Property "Titanium.UI.TableView#.deleteRow" is not implemented yet.');
		},
		insertRowAfter: function(index, row, properties) {
			console.debug('Property "Titanium.UI.TableView#.insertRowAfter" is not implemented yet.');
		},
		insertRowBefore: function(index, row, properties) {
			console.debug('Property "Titanium.UI.TableView#.insertRowBefore" is not implemented yet.');
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
		
		properties: {
			_defaultWidth: "100%",
			_defaultHeight: "100%",
			data: {
				set: function(value,oldValue) {
					if (is(value,'Array')) {
						
						// Remove the old children
						for(var i in oldValue) {
							this.remove(oldValue[i]);
						}
						
						// Convert any object literals to TableViewRow instances, and update TableViewRow instances with row info
						for (var i in value) {
							if (!isDef(value[i].declaredClass) || value[i].declaredClass != "Ti.UI.TableViewRow") {
								value[i] = Ti.UI.createTableViewRow(value[i]);
							}
						}
						
						// Add the new children
						for (var i in value) {
							this.rows.add(value[i]);
							this.rows.add(Ti.UI.createView({height: "1px", width: "100%", backgroundColor: this.separatorColor}));
						}
						
						// Relayout the screen
						this.doFullLayout();
						
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
						this.doFullLayout();
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
						this.doFullLayout();
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
						this.doFullLayout();
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
						this.doFullLayout();
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