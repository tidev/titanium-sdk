define(
	["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/style", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, dom, event, style, lang, FontWidget, UI) {
		
	var on = require.on,
		setStyle = style.set;

	return declare("Ti._.UI.TextBox", FontWidget, {

		constructor: function(){
			this._addEventModifier(["click", "singletap", "blur", "change", "focus", "return"], function(data) {
				data.value = this.value;
			});
		},

		_preventDefaultTouchEvent: false,

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
				this._capitalize();
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
		},

		_capitalize: function(ac, val) {
			var f = this._field,
				ac = "off";
			switch (ac || this.autocapitalization) {
				case UI.TEXT_AUTOCAPITALIZATION_ALL:
					f.value = f.value.toUpperCase();
					break;
				case UI.TEXT_AUTOCAPITALIZATION_SENTENCES:
					ac = "on";
			}
			this._field.autocapitalize = ac;
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
				set: function(value, oldValue) {
					value !== oldValue && this._capitalize(value);
					return value;
				}
			},

			autocorrect: {
				value: false,
				set: function(value) {
					this._field.autocorrect = !!value ? "on" : "off";
					return value;
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
				set: function(value) {
					setStyle(this._field, "textAlign", /(center|right)/.test(value) ? value : "left");
					return value;
				}
			},

			value: {
				get: function() {
					return this._showingHint ? "" : this._field.value;
				},
				set: function(value) {
					return this._capitalize(this._field.value = value);
				},
				value: ""
			}
		}

	});

});