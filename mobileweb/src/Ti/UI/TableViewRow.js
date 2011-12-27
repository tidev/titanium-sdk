define("Ti/UI/TableViewRow", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

	var set = style.set,
		undef;

	return declare("Ti.UI.TableViewRow", View, {
		
		constructor: function(args) {
			this.layout = 'horizontal';
			set(this.domNode,"boxAlign","center");
			
			this.leftImageView = Ti.UI.createImageView();
			this.add(this.leftImageView); 
			
			this.titleLabel = Ti.UI.createLabel({width: "auto"});
			this.add(this.titleLabel);
			
			this.rightImageView = Ti.UI.createImageView();
			this.add(this.rightImageView);
			
			// Holds detail, child, or check
			this.extraView = Ti.UI.createView({width: "auto"});
			this.add(this.extraView);
		},

		properties: {
			_defaultHeight: "50px",
			_defaultWidth: "100%",
			_tableRowHeight: undef,
			hasCheck: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.hasCheck" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasCheck" is not implemented yet.');
					return value;
				}
			},
			hasChild: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.hasChild" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasChild" is not implemented yet.');
					return value;
				}
			},
			hasDetail: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.hasDetail" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.hasDetail" is not implemented yet.');
					return value;
				}
			},
			leftImage: {
				set: function(value) {
					this.leftImageView.image = value;
					return value;
				}
			},
			rightImage: {
				set: function(value) {
					this.rightImageView.image = value;
					return value;
				}
			},
			selectedBackgroundColor: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundColor" is not implemented yet.');
					return value;
				}
			},
			selectedBackgroundImage: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundImage" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedBackgroundImage" is not implemented yet.');
					return value;
				}
			},
			selectedColor: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.selectedColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.selectedColor" is not implemented yet.');
					return value;
				}
			},
			title: {
				set: function(value) {
					this.titleLabel.text = value;
					return value;
				}
			}
		}

	});

});