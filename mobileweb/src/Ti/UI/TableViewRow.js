define("Ti/UI/TableViewRow", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

	var undef;

	return declare("Ti.UI.TableViewRow", View, {

		properties: {
			_defaultWidth: "100%",
			_tableRowHeight: undef,
			hasCheck: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasCheck" is not implemented yet.');
					return value;
				}
			},
			hasChild: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasChild" is not implemented yet.');
					return value;
				}
			},
			hasDetail: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasDetail" is not implemented yet.');
					return value;
				}
			},
			leftImage: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.leftImage" is not implemented yet.');
					return value;
				}
			},
			rightImage: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.rightImage" is not implemented yet.');
					return value;
				}
			},
			selectedBackgroundColor: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundColor" is not implemented yet.');
					return value;
				}
			},
			selectedBackgroundImage: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundImage" is not implemented yet.');
					return value;
				}
			},
			selectedColor: {
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedColor" is not implemented yet.');
					return value;
				}
			},
			title: {
				set: function(value) {
					this.domNode.innerHTML = value;
					return value;
				}
			}
		}

	});

});