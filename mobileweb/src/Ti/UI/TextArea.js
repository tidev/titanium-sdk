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
		},
		
		blur: function() {
			console.debug('Method "Titanium.UI.TextArea#.blur" is not implemented yet.');
		},
		
		focus: function() {
			console.debug('Method "Titanium.UI.TextArea#.focus" is not implemented yet.');
		},
		
		hasText: function() {
			console.debug('Method "Titanium.UI.TextArea#.hasText" is not implemented yet.');
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
				set: function(value) {
					this.textArea.value = value;
					return value;
				}
			},
			
			editable: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextArea#.editable" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextArea#.editable" is not implemented yet.');
					return value;
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
