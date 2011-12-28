define("Ti/UI/TextArea", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

    var set = style.set,
        undef;

	return declare("Ti.UI.TextArea", Widget, {

		constructor: function(args) {
			this.textArea = dom.create("textarea", {
				className: css.clean("TiUITextAreaTextArea")
			});
			set(this.textArea, "width", "100%");
			set(this.textArea, "height", "100%");
			this.domNode.appendChild(this.textArea);
		},

		properties: {
            _defaultWidth: "auto",
            _defaultHeight: "auto",
			value: {
				get: function() {return this.textArea.value;},
				set: function(value) {
					this.textArea.value = value;
					return value;
				}
			},
			hintText: {
				set: function(value) {
					this.textArea.placeholder = value;
					return value;
				}
			}
		}
	});

});
