define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/UI/FontWidget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI"], 
	function(declare, Widget, FontWidget, lang, dom, style, UI) {

	var setStyle = style.set;

	var InternalProgressBar = declare(Widget, {
			
			constructor: function() {
				this._contentContainer = dom.create("div", {
					className: "TiUIProgressBarContainer",
					style: {
						pointerEvents: "none",
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						position: "absolute",
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
			this._add(this._contentContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT,
				left: 0,
				top: 0,
				layout: UI._LAYOUT_CONSTRAINING_VERTICAL
			}));
			this._contentContainer._layout._defaultHorizontalLayout = "start";
			this._contentContainer._add(this._message = UI.createLabel());
			this._contentContainer._add(this._progressBar = new InternalProgressBar({
				width: UI.INHERIT,
				height: UI.INHERIT
			}));
		},
		
		_updateSize: function() {
			this._progressBar._setPosition((this.value - this.min) / (this.max - this.min));
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
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
					return Math.min(value, this.max);
				},
				post: "_updateSize",
				value: 0
			},
			
			max: {
				set: function(value) {
					return Math.max(value, this.min);
				},
				post: "_updateSize",
				value: 100
			},
			
			value: {
				set: function(value) {
					return Math.min(Math.max(value, this.min), this.max);
				},
				post: "_updateSize",
				value: 0
			}
		}
		
	});
});