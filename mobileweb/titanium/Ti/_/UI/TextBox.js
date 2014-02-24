define(
	["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/style", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, dom, event, style, lang, FontWidget, UI) {
		
	var on = require.on,
		setStyle = style.set;

	return declare("Ti._.UI.TextBox", FontWidget, {

		constructor: function(){
			this._addEventModifier(["click", "singletap", "blur", "change", "focus", "return"], function(data) {
				data.value = this._getInternalText();
			});
		},

		_initTextBox: function(field) {
			// wire up events
			this._field = field;
			var updateInterval = null,
				previousText = "";

			this._addStyleableDomNode(this._setFocusNode(field));

			on(field, "keydown", this, function(e) {
				if (this.editable) {
					if (e.keyCode === 13) {
						if (this.suppressReturn) {
							event.stop(e);
							field.blur();
						}
						this.fireEvent("return");
					}
				} else {
					event.stop(e);
					return false;
				}
			});

			on(field, "keypress", this, function() {
				setTimeout(lang.hitch(this, function () { this._capitalize() }));
			});

			on(field, "focus", this, function(){
				this.fireEvent("focus");

				updateInterval = setInterval(lang.hitch(this, function(){
					var value = field.value;
					if (previousText.length !== value.length || previousText !== value) {
						this.fireEvent("change");
						previousText = value;
					}
				}), 200);
			});

			on(field, "blur", this, function(){
				clearInterval(updateInterval);
				this.fireEvent("blur");
			});
			
			// Set the autocorrect value via the setter
			this.autocorrect = true;
		},

		_setInternalText: function(value) {
			if (this._field.value !== value) {
				this._field.value = value;
				this._capitalize();
			}
		},
		
		_getInternalText: function() {
			return this._field.value;
		},
		
		_updateInternalText: function() {
			this._setInternalText(this._getInternalText());
		},

		_capitalize: function() {
			var acval = "off",
				field = this._field;
			switch (this.autocapitalization) {
				case UI.TEXT_AUTOCAPITALIZATION_ALL:
					field.value = field.value.toUpperCase();
					break;
				case UI.TEXT_AUTOCAPITALIZATION_SENTENCES:
					acval = "on";
			}
			this._field.autocapitalize = acval;
		},

		blur: function() {
			this._field.blur();
		},

		focus: function() {
			this._field.focus();
		},

		hasText: function() {
			return !!this._field.value;
		},

		properties: {
			autocapitalization: {
				value: UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
				post: "_capitalize"
			},

			autocorrect: {
				post: function(value) {
					this._field.autocorrect = !!value ? "on" : "off";
				}
			},

			editable: true,

			maxLength: {
				set: function(value) {
					value = Math.max(value|0, 0);
					dom.attr[value > 0 ? "set" : "remove"](this._field, "maxlength", value);
					return value;
				}
			},

			returnKeyType:  function() {
				return UI.RETURNKEY_DEFAULT;
			},

			suppressReturn: true,

			textAlign: {
				post: function(value) {
					setStyle(this._field, "textAlign", /(center|right)/.test(value) ? value : "left");
				}
			},

			value: {
				get: function() {
					return this._getInternalText();
				},
				post: "_setInternalText",
				value: ""
			}
		}

	});

});