define(["Ti/_/declare", "Ti/_/lang", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, lang, View, dom, css, style, UI) {

	var setStyle = style.set,
		undef,
		isDef = lang.isDef,
		imagePrefix = "themes/titanium/UI/TableViewRow/"
		checkImage = imagePrefix + "check.png",
		childImage = imagePrefix + "child.png",
		detailImage = imagePrefix + "detail.png";

	return declare("Ti.UI.TableViewRow", View, {
		
		// The number of pixels 1 indention equals
		_indentionScale: 10,
		
		constructor: function(args) {
			this.add(this._defaultControl = UI.createView({
				width: "100%",
				height: "100%",
				layout: "horizontal"
			}));
			this._defaultControl._layout._defaultVerticalAlignment = "center";
			
			this._defaultControl.add(this._leftImageView = UI.createImageView({
				width: UI.SIZE,
				height: UI.SIZE
			})); 

			this._defaultControl.add(this._titleLabel = UI.createLabel({
				width: UI.FILL, height: "100%" 
			}));

			this._defaultControl.add(this._rightImageView = UI.createImageView({
				width: UI.SIZE, 
				height: UI.SIZE
			}));
		},
		
		_usingDefaultControl: 1,

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.SIZE,
		
		_tableRowHeight: undef,
		
		_tableViewSection: null,
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._tableViewSection && this._tableViewSection._tableView && (this._tableViewSection._tableView._tableViewRowClicked = this);
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},

		_doBackground: function(evt) {
			if (this._touching) {
				this._titleLabel.color = this.selectedColor;
			} else {
				this._titleLabel.color = this.color;
			}
			View.prototype._doBackground.apply(this,arguments);
		},

		properties: {
			className: undef,
			color: {
				set: function(value) {
					this._titleLabel.color = value;
					return value;
				}
			},
			hasCheck: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild) {
						this._rightImageView.image = value ? checkImage : "";
					}
					return value;
				}
			},
			hasChild: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage)) {
						this._rightImageView.image = value ? childImage : "";
					}
					return value;
				}
			},
			hasDetail: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild && !this.hasCheck) {
						this._rightImageView.image = value ? detailImage : "";
					}
					return value;
				}
			},
			indentionLevel: {
				set: function(value) {
					this._leftImageView.left = value * this._indentionScale;
					return value;
				},
				value: 0
			},
			leftImage: {
				set: function(value) {
					this._leftImageView.image = value;
					return value;
				}
			},
			rightImage: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this._rightImageView.image = value;
					}
					return value;
				}
			},
			selectedColor: undef,
			title: {
				set: function(value) {
					this._titleLabel.text = value;
					return value;
				}
			},
			
			// Pass through to the label
			font: {
				set: function(value) {
					this._titleLabel.font = value;
					return value;
				}
			}
		}

	});

});