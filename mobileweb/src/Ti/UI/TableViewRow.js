define("Ti/UI/TableViewRow", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

	var set = style.set,
		undef,
		isDef = require.isDef,
		checkImage = "theme/titanium/UI/TableViewRow/check.png",
		childImage = "theme/titanium/UI/TableViewRow/child.png",
		detailImage = "theme/titanium/UI/TableViewRow/detail.png";

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
			
			this.rightImageView = Ti.UI.createImageView({
				right: 0,
				top: 0,
				width: "auto", 
				height: "100%"
			});
			this.add(this.rightImageView);
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
			className: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.className" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.className" is not implemented yet.');
					return value;
				}
			},
			color: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.color" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.color" is not implemented yet.');
					return value;
				}
			},
			hasCheck: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild) {
						this.rightImageView.image = value ? checkImage : undef;
					}
					return value;
				}
			},
			hasChild: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage)) {
						this.rightImageView.image = value ? childImage : undef;
					}
					return value;
				}
			},
			hasDetail: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild && !this.hasCheck) {
						this.rightImageView.image = value ? detailImage : undef;
					}
					return value;
				}
			},
			indentionLevel: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TableViewRow#.indentionLevel" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TableViewRow#.indentionLevel" is not implemented yet.');
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
						this.rightImageView.image = value;
					}
					return value;
				}
			},
			title: {
				set: function(value) {
					this.titleLabel.text = value;
					return value;
				}
			},
			
			// Pass through to the label
			font: {
				set: function(value) {
					this.titleLabel.font = value;
					return value;
				}
			}
		}

	});

});