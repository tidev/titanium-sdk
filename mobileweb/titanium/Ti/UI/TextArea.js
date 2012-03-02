define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, dom, css, style, UI) {

	return declare("Ti.UI.TextArea", TextBox, {

		domType: "textarea",

		constructor: function(args) {
			style.set(this._field = this.domNode, {
				width: "100%",
				height: "100%"
			});

			this._initTextBox();
		},

		_defaultWidth: Ti.UI.SIZE,

		_defaultHeight: Ti.UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: width === Ti.UI.SIZE ? this._measureText(this.value, this.textArea, width).width : width,
				height: height === Ti.UI.SIZE ? this._measureText(this.value, this.textArea, width).height : height
			};
		},

		_setTouchEnabled: function(value) {
			TextBox.prototype._setTouchEnabled.apply(this,arguments);
			this.slider && style.set(this.textArea, "pointerEvents", value ? "auto" : "none");
		}

	});

});
