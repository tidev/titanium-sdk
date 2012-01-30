define("Ti/UI/TableViewRow", ["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, View, dom, css, style) {

	var set = style.set,
		undef,
		isDef = require.isDef,
		imagePrefix = "themes/titanium/UI/TableViewRow/"
		checkImage = imagePrefix + "check.png",
		childImage = imagePrefix + "child.png",
		detailImage = imagePrefix + "detail.png";

	return declare("Ti.UI.TableViewRow", View, {
		
		// The number of pixels 1 indention equals
		_indentionScale: 10,
		
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
		_tableViewSection: null,
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._tableViewSection && this._tableViewSection._tableView && (this._tableViewSection._tableView._tableViewRowClicked = this);
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_doLayout: function(){
			View.prototype._doLayout.apply(this,arguments);
		},
		
		_doBackground: function(evt) {
			if (this._touching) {
				this.titleLabel.color = this.selectedColor;
			} else {
				this.titleLabel.color = this.color;
			}
			View.prototype._doBackground.apply(this,arguments);
		},

		properties: {
			className: undef,
			color: {
				set: function(value) {
					this.titleLabel.color = value;
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
				set: function(value) {
					this.leftView.left = value * this._indentionScale;
					return value;
				},
				value: 0
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
			selectedColor: undef,
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