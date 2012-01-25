define("Ti/UI/TableViewSection", ["Ti/_/declare", "Ti/_/UI/Widget"], function(declare, Widget) {

	return declare("Ti.UI.TableViewSection", Widget, {

		_defaultHeight: "auto",
		_defaultWidth: "auto",
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._parent && this._parent._parent && (this._parent._parent._tableViewSectionClicked = this);
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},
			
		properties: {
			footerTitle: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewSection#.footerTitle" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewSection#.footerTitle" is not implemented yet.');
					return value;
				}
			},
			
			footerView: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewSection#.footerView" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewSection#.footerView" is not implemented yet.');
					return value;
				}
			},
			
			headerTitle: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewSection#.headerTitle" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewSection#.headerTitle" is not implemented yet.');
					return value;
				}
			},
			
			headerView: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewSection#.headerView" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewSection#.headerView" is not implemented yet.');
					return value;
				}
			},
			
			rowCount: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewSection#.rowCount" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewSection#.rowCount" is not implemented yet.');
					return value;
				}
			}
		}

	});

});