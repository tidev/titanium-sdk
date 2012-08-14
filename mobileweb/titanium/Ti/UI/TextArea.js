define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, dom, css, style, UI) {

	return declare("Ti.UI.TextArea", TextBox, {

		constructor: function(args) {
			var field = dom.create("textarea", {
				autocomplete: "off",
				className: "TiUITextFieldInput"
			}, this.domNode);

			this._initTextBox(field);
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: this._measureText(this.value, this._field, width).width,
				height: this._measureText(this.value, this._field, width).height
			};
		},

		_setTouchEnabled: function(value) {
			TextBox.prototype._setTouchEnabled.apply(this,arguments);
			this.slider && style.set(this.textArea, "pointerEvents", value ? "auto" : "none");
		}

	});

});
