define(["Ti/_/declare", "Ti/_/lang", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI", "Ti/_/Layouts/ConstrainingHorizontal"],
	function(declare, lang, View, dom, css, style, UI, ConstrainingHorizontal) {

	var setStyle = style.set,
		isDef = lang.isDef,
		imagePrefix = "themes/" + require.config.ti.theme + "/UI/TableViewRow/",
		checkImage = imagePrefix + "check.png",
		childImage = imagePrefix + "child.png",
		detailImage = imagePrefix + "detail.png";

	return declare("Ti.UI.TableViewRow", View, {

		// The number of pixels 1 indention equals
		_indentionScale: 10,

		constructor: function(args) {

			this._layout = new ConstrainingHorizontal(this);

			this._add(this._leftImageView = UI.createImageView({
				width: UI.SIZE,
				height: UI.SIZE
			})); 

			var centerContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT
			});
			this._add(centerContainer);

			centerContainer._add(this._titleLabel = UI.createLabel({
				width: UI.INHERIT,
				height: UI.INHERIT,
				wordWrap: false
			}));

			centerContainer._add(this._contentContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT
			}));

			this._add(this._rightImageView = UI.createImageView({
				right: 0,
				width: UI.SIZE,
				height: UI.SIZE
			}));

			// Force single tap to be processed.
			this.addEventListener("singletap");
		},

		_defaultWidth: UI.INHERIT,

		_defaultHeight: UI.SIZE,
		
		_tableRowHeight: void 0,
		
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

		add: function(view) {
			this._contentContainer._add(view);
			this._publish(view);
		},

		remove: function(view) {
			this._contentContainer._remove(view);
			this._unpublish(view);
		},

		properties: {
			className: void 0,
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
			layout: {
				set: function(value) {
					this._contentContainer.layout = value;
				}
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
			selectedColor: void 0,
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