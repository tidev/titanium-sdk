define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/css", "Ti/_/dom", "Ti/_/lang", "Ti/_/style", "Ti/UI"/*, "Ti/UI/Tizen"*/],
	function(declare, TextBox, css, dom, lang, style, UI/*, Tizen*/) {

	var borderStyles = ["None", "Line", "Bezel", "Rounded"],
		keyboardPost = {
			post: "_setKeyboardType"
		},
		setStyle = style.set,
		on = require.on,
		
		_calculateWidth = function(showCancel, width) {
			var widthSign = "", widthLength = width.length, width_value = parseInt(width), cancelWidth = showCancel ? 43 : 0;
			
			if (width === UI.FILL || width === UI.SIZE || width == '100%') {
				return '97%';
			}
			widthSign = width.substring(widthLength - 1, widthLength) === "%" ? "%" : width.substring(widthLength - 2, widthLength); 
			widthSign = ((widthSign !== "%") && (parseInt(widthSign) !== NaN)) ? 'px' : widthSign;
			if (widthSign !== "%") {
				return (width_value - cancelWidth) + widthSign;
			} else {
				return '97%';
			}
		};

	return declare("Ti.UI.SearchBar", TextBox, {

		constructor: function(args) {
			// note: do NOT add position:absolute to this style under ANY circumstances. It will break text field on WebKit
			if (!args.width) {
				args.width = '100%';
			}
			var self = this, f = this._field = dom.create("input", {
				autocomplete: "off",
				style: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					float: 'left',
					display: 'inline-block',
					width: _calculateWidth(args.showCancel, args.width),
					height: '100%'
				}
			}, this._fieldWrapper = dom.create("span", {
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					paddingRight: args.showCancel ? '43px' : 0,
					width: '100%',
					height: '100%',
					display: 'table'
				}
			}, this.domNode));
			
				this._cancelButton = dom.create("button", {
					style: {
						background: "url('themes/default/UI/SearchBar/close.png') no-repeat 50% 50%",
						position: "absolute",
						top: 0,
						bottom: 0,
						width: '43px',
						height: '43px',
						display: (args && args.showCancel) ? 'inline-block' : 'none'
					}			
				}, this._fieldWrapper, this.domNode);
				this._cancelButton.addEventListener('click', function(e){
					f.value = "";
					f.blur();
					self.fireEvent("cancel");
				});						

			
			this._initTextBox(f);
			this.keyboardType = void 0;
			this._setKeyboardType();
			this.borderStyle = UI.INPUT_BORDERSTYLE_BEZEL;

			this._disconnectFocusEvent = on(f, "focus", this, function() {			
				this._focused = 1;
				this._setInternalText(this.clearOnEdit ? "" : this._getInternalText());
			});
			this._disconnectBlurEvent = on(f, "blur", this, function() {
				this._focused = 0;
				this._updateInternalText();
			});
			this.created = 1;
			
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
				this._setKeyboardType();
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
				width: this._measureText(this.value, this._field, width).width + 6,
				height: this._measureText(this.value, this._field, width).height + 6
			};
		},

		_setTouchEnabled: function(value) {
			this.slider && setStyle(this._field, "pointerEvents", value ? "auto" : "none");
		},

		_setKeyboardType: function() {
			var type = "text";
			if (this.passwordMask && !this._showingHint) {
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
					case UI.KEYBOARD_NUMBERS_PUNCTUATION: 
						type = "number";
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

		blur: function() {
			this._field.blur();
		},

		focus: function() {
			this._field.focus();
		},

		cancel: function() {
			this._field.value = "";
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
			
			showCancel: {
				set: function(value) {
					var width = this._field.style.width, offset = value ? -43 : 43,
						widthType = width.substring(width.length - 1, width.length);
					if ((widthType != '%') && (this.created == 1)) {
						width = parseInt(width, 10) + offset;
						this._field.style.width = width + "px";
					} else if (widthType == '%' && !value) {
						this._field.style.width = '97%';
					}

					this._fieldWrapper.style.paddingRight = value ? '43px' : '0';
					this._cancelButton.style.display = value ? "inline-block" : "none";
					return value;
				},
				value: false
			},			

			hintText: {
				post: "_updateInternalText",
				value: ""
			},

			keyboardType: keyboardPost,

			passwordMask: keyboardPost,
			
			// softKeyboardOnFocus: Tizen.SOFT_KEYBOARD_DEFAULT_ON_FOCUS
		}

	});

});
