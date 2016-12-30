define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, dom, css, style, UI) {

	var borderStyles = ["None", "Line", "Bezel", "Rounded"],
		keyboardPost = {
			post: "_setKeyboardType"
		},
		setStyle = style.set,
		on = require.on;


	return declare("Ti.UI.TextArea", TextBox, {

		constructor: function(args) {
			var field = dom.create("textarea", {
				autocomplete: "off",
				className: "TiUITextFieldInput"
			}, this.domNode);

			this._initTextBox(field);

			this.borderStyle = UI.INPUT_BORDERSTYLE_NONE;

			this._disconnectFocusEvent = on(field, "focus", this, function() {
				this._focused = 1;
				this._setInternalText(this.clearOnEdit ? "" : this._getInternalText());
			});
			this._disconnectBlurEvent = on(field, "blur", this, function() {
				this._focused = 0;
				this._updateInternalText();
				this.domNode.style.color = "#999";
			});
		},

		destroy: function() {
			this._disconnectFocusEvent();
			this._disconnectBlurEvent();
			TextBox.prototype.destroy.apply(this, arguments);
		},

		_showingHint: 1,

		_setInternalText: function(value) {
			var showingHint = !this._focused && !value;
			if (showingHint !== this._showingHint) {
				this._showingHint = showingHint;
			}
			TextBox.prototype._setInternalText.call(this, showingHint ? this.hintText : value);
		},

		_getInternalText: function() {
			return this._showingHint ? "" : TextBox.prototype._getInternalText.call(this);
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
		},
		properties: {
			borderStyle: {
				set: function(value, oldValue) {
					var n = this.domNode,
						s = "TiUITextFieldBorderStyle";
					if (value !== oldValue) {
						// This code references constants Ti.UI.INPUT_BORDERSTYLE_NONE,
						// Ti.UI.INPUT_BORDERSTYLE_LINE, Ti.UI.INPUT_BORDERSTYLE_BEZEL, and Ti.UI.INPUT_BORDERSTYLE_ROUNDED
						css.remove(n, s + borderStyles[oldValue]);
						css.add(n, s + borderStyles[value]);
					}
					return value;
				}
			},

			clearOnEdit: false,

			hintText: {
				post: "_updateInternalText",
				value: ""
			}
		}

	});

});
