define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/UI/FontWidget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style"], function(declare, Widget, FontWidget, lang, dom, style) {

	var setStyle = style.set;

	var InternalProgressBar = declare(Widget, {
			
			constructor: function() {
				this._contentContainer = dom.create("div", {
					className: "TiUIProgressBarContainer",
					style: {
						pointerEvents: "none",
						width: "100%",
						height: "100%",
						overflow: "hidden"
					}
				}, this.domNode);
				this._indicator = dom.create("div", {
					className: "TiUIProgressBarIndicator",
					style: {
						pointerEvents: "none",
						width: "0%",
						height: "100%"
					}
				}, this._contentContainer);
			},
			
			_doLayout: function(params) {
				var values = this.properties.__values__;
				values.width = params.parentAuto.width ? "auto" : "100%";
				values.height = params.parentAuto.height ? "auto" : "100%";
				Widget.prototype._doLayout.call(this,params);
			},
			
			_getContentSize: function(width, height) {
				return {
					width: 200,
					height: 25
				};
			},
			
			_setPosition: function(location) {
				setStyle(this._indicator, "width", Math.round(100 * location) + "%");
			}
		});

	return declare("Ti.UI.ProgressBar", Widget, {
		
		constructor: function() {
			this.add(this._contentContainer = Ti.UI.createView({
				width: "auto",
				height: "auto",
				left: 0,
				top: 0,
				layout: "vertical"
			}));
			this._contentContainer._layout._defaultHorizontalLayout = "left";
			this._contentContainer.add(this._message = Ti.UI.createLabel());
			this._contentContainer.add(this._progressBar = new InternalProgressBar());
		},
			
		_doLayout: function(originX, originY, parentWidth, parentHeight, defaultHorizontalAlignment, defaultVerticalAlignment, isParentAutoWidth, isParentAutoHeight) {
			var props = this._contentContainer.properties.__values__,
				hasAutoWidth = this.width === "auto" || !lang.isDef(this.width),
				hasAutoHeight = this.height === "auto" || !lang.isDef(this.height);
			if (!hasAutoWidth && !hasAutoHeight) {
				props.width = "100%";
				props.height = "100%";
			} else if (!hasAutoWidth) {
				props.width = "100%";
				props.height = "auto";
			} else if (!hasAutoHeight) {
				props.width = "auto";
				props.height = "100%";
			} else {
				props.width = "auto";
				props.height = "auto";
			}
			
			if (this._message._getContentSize("auto","auto").width === 0) {
				this._message.properties.__values__.height = 0;
				this._progressBar.properties.__values__.top = 0;
			} else {
				this._message.properties.__values__.height = "auto";
				this._progressBar.properties.__values__.top = 2;
			}
			
			Widget.prototype._doLayout.apply(this,arguments);
		},
		
		_updateSize: function() {
			this._progressBar._setPosition((this.value - this.min) / (this.max - this.min));
		},

		_defaultWidth: "auto",

		_defaultHeight: "auto",
		
		properties: {
			color: {
				set: function(value) {
					this._message.color = value;
					return value;
				}
			},
			
			font: {
				set: function(value) {
					this._message.font = value;
					return value;
				}
			},
			
			message: {
				set: function(value) {
					this._message.text = value;
					return value;
				}
			},
			
			min: {
				set: function(value) {
					if (value > this.max) {
						value = this.max;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 0
			},
			
			max: {
				set: function(value) {
					if (value < this.min) {
						value = this.min;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 100
			},
			
			value: {
				set: function(value) {
					if (value < this.min) {
						value = this.min;
					} else if (value > this.max) {
						value = this.max;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 0
			}
		}
		
	});
});