define("Ti/UI/TextArea", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, FontWidget, dom, css, style) {

    var set = style.set,
        undef;

	return declare("Ti.UI.TextArea", FontWidget, {

		constructor: function(args) {
			this.textArea = dom.create("textarea", {
				className: css.clean("TiUITextAreaTextArea")
			});
			this.domNode.appendChild(this.textArea);
			this._addStyleableDomNode(this.textArea);
			set(this.textArea,"resize","none");
			set(this.textArea,"backgroundColor","transparent");
			set(this.textArea,"borderStyle","none");
			set(this.textArea,"width","100%");
			set(this.textArea,"height","100%");
		},
		
		blur: function() {
			this.textArea.blur();
		},
		
		focus: function() {
			this.textArea.focus();
		},
		
		hasText: function() {
			return (this.textArea.value !== "");
		},

		properties: {
            _defaultWidth: "auto",
            _defaultHeight: "auto",
            
			hintText: {
				set: function(value) {
					this.textArea.placeholder = value;
					return value;
				}
			},
			
			value: {
				get: function() { return this.textArea.value; },
				set: function(value) {
					this.textArea.value = value;
					return value;
				}
			},
			
			editable: {
				get: function(value) {
					return this.textArea.readonly;
				},
				set: function(value) {
					his.textArea.readonly = value ? true : false;
                    return this.textArea.readonly;
				}
			},
			
			textAlign: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextArea#.textAlign" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextArea#.textAlign" is not implemented yet.');
					return value;
				}
			},
			
		}
	});

});
