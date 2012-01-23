define("Ti/UI/TableViewRow", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

	var set = style.set,
		undef;

	return declare("Ti.UI.TableViewRow", View, {
		
		constructor: function(args) {
			
			this.leftView = Ti.UI.createView({
				left: 0,
				top: 0,
				width: "auto", 
				height: "100%",
				layout: "horizontal"
			}),
			set(this.leftView.domNode,"boxAlign","center");
			this.add(this.leftView);
			
			this.leftImageView = Ti.UI.createImageView();
			this.leftView.add(this.leftImageView); 
			
			this.titleLabel = Ti.UI.createLabel({width: "auto", height: "100%"});
			this.leftView.add(this.titleLabel);
			
			this.rightView = Ti.UI.createView({
				right: 0,
				top: 0,
				width: "auto", 
				height: "100%",
				layout: "horizontal"
			});
			this.add(this.rightView);
		},
		
		_defaultHeight: "auto",
		_defaultWidth: "100%",
		_tableRowHeight: undef,
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._parent && this._parent._parent && (this._parent._parent._tableViewRowClicked = this);
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		doLayout: function(){
			View.prototype.doLayout.apply(this,arguments);
		},

		properties: {
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
				set: function(value, oldValue) {
					if (value !== oldValue) {
						for (var i in this.rightView.children) {
							this.rightView.remove(this.rightView.children[i]);
						}
						this.rightView.add(Ti.UI.createImageView({
							image: value
						}));
					}
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