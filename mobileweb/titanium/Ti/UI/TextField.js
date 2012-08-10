define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/css", "Ti/_/dom", "Ti/_/lang", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, css, dom, lang, style, UI) {

	var borderStyles = ["None", "Line", "Bezel", "Rounded"],
		keyboardPost = {
			post: "_setKeyboardType"
		},
		setStyle = style.set;

	return declare("Ti.UI.TextField", TextBox, {

		constructor: function(args) {
			// note: do NOT add position:absolute to this style under ANY circumstances. It will break text field on WebKit
			var field = dom.create("input", {
				autocomplete: "off",
				className: "TiUITextFieldInput"
			}, this.domNode);

			this._initTextBox(field);
			this._setKeyboardType();
			this.borderStyle = UI.INPUT_BORDERSTYLE_BEZEL;

			this._disconnectFocusEvent = require.on(field, "focus", this, function() {
				this.clearOnEdit && (field.value = "");
			});
		},

		destroy: function() {
			this._disconnectFocusEvent();
			TextBox.prototype.destroy.apply(this, arguments);
		},

        _defaultWidth: UI.SIZE,

        _defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: this._measureText(this.value, this._field, width).width + 6,
				height: this._measureText(this.value, this._field, width).height + 6
			};
		},

		_setTouchEnabled: function(value) {
			this.slider && setStyle(this._field, "pointerEvents", value ? "auto" : "none");
		},

		_setKeyboardType: function() {
			var type = "text";
			if (this.passwordMask) {
				type = "password";
			} else {
				switch (this.keyboardType) {
					case UI.KEYBOARD_EMAIL:
						type = "email";
						break;
					case UI.KEYBOARD_NUMBER_PAD:
						type = "number";
						break;
					case UI.KEYBOARD_PHONE_PAD:
						type = "tel";
						break;
					case UI.KEYBOARD_URL:
						type = "url";
						break;
				}
			}
			// Note: IE9 throws an exception if you don't set an input type it supports
			try {
				this._field.type = type;
			} catch(e) {
				this._field.type = "text";
			}
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
				set: function(value) {
					try { // IE9 doesn't support placeholder and throws an exception if you try and set it.
						this._field.placeholder = value;
					} catch(e) {}
					return value;
				}
			},

			keyboardType: keyboardPost,

			passwordMask: keyboardPost
		}

	});

});
