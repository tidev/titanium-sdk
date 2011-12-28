define("Ti/UI/TextField", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

	var set = style.set,
        undef;

	return declare("Ti.UI.TextField", Widget, {

		constructor: function(args) {
			this.textField = dom.create("input", {
				className: css.clean("TiUITextFieldField"),
			});
			this.textField.type = "text";
			this.domNode.appendChild(this.textField);			
		},

		properties: {
            _defaultWidth: "auto",
            _defaultHeight: "auto",
			hintText: {
				set: function(value) {
					this.textField.placeholder = value;
					return value;
				}
			}

		}

	});

});
