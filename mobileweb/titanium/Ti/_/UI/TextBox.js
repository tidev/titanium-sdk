define(
	["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/style", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, dom, event, style, lang, FontWidget, UI) {

	return declare("Ti._.UI.TextBox", FontWidget, {

		_field: null,
		
		_preventDefaultTouchEvent: false,

		_initTextBox: function() {
			// wire up events
			var field = this._field,
				form = this._form = dom.create("form", null, this.domNode);

			this._addStyleableDomNode(this._setFocusNode(field));

			require.on(field, "keydown", this, function(e) {
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
				}
			});
			require.on(field, "keypress", this, function() {
				this._capitalize();
			});
			
			var updateInterval = null,
				previousText = "";
			require.on(field, "focus", this, function(){
				updateInterval = setInterval(lang.hitch(this,function(){
					var value = field.value,
						newData = false;
					if (previousText.length != value.length) {
						newData = true;
					} else if(previousText != value) {
						newData = true;
					}
					if (newData) {
						this.fireEvent("change");
						previousText = value;
					}
				}),200);
			});
			require.on(field, "blur", this, function(){
				clearInterval(updateInterval);
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
			this.fireEvent("blur");
		},

		focus: function() {
			this._field.focus();
			this.fireEvent("focus");
		},

		hasText: function() {
			return !this._field.value.length;
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

			returnKeyType: {
				value: UI.RETURNKEY_DEFAULT,
				set: function(value) {
					var title = "",
						dest = this.domNode;
					if (value !== UI.RETURNKEY_DEFAULT) {
						deset = this._form;
						[4,8,10].indexOf(value) !== -1 && (title = "Search");
					}
					this._field.title = title;
					dom.place(this._field, dest);
					return value;
				}
			},

			suppressReturn: true,

			textAlign: {
				set: function(value) {
					style.set(this._field, "text-align", value === Ti.UI.TEXT_ALIGNMENT_RIGHT ? "right" : value === Ti.UI.TEXT_ALIGNMENT_CENTER ? "center" : "left");
					return value;
				}
			},

			value: {
				get: function() {
					return this._field.value;
				},
				set: function(value) {
					return this._capitalize(this._field.value = value);
				},
				value: ""
			}
		}

	});

});