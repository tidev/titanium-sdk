define("Ti/UI/TextField", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, FontWidget, dom, css, style) {

	var set = style.set,
        undef;

	return declare("Ti.UI.TextField", FontWidget, {

		constructor: function(args) {
			this.textField = dom.create("input", {
				className: css.clean("TiUITextFieldField"),
			});
			this.domNode.appendChild(this.textField);
			this._addStyleableDomNode(this.textField);
			set(this.textField,"backgroundColor","transparent");
			set(this.textField,"borderStyle","none");
			set(this.textField,"width","100%");
			set(this.textField,"height","100%");
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
					this.textField.placeholder = value;
					return value;
				}
			},
			
			value: {
				set: function(value) {
					this.textField.value = value;
					return value;
				}
			},
			
			editable: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.editable" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.editable" is not implemented yet.');
					return value;
				}
			},
			
			paddingLeft: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.paddingLeft" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.paddingLeft" is not implemented yet.');
					return value;
				}
			},
			
			paddingRight: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.paddingRight" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.paddingRight" is not implemented yet.');
					return value;
				}
			},
			
			passwordMask: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.passwordMask" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.passwordMask" is not implemented yet.');
					return value;
				}
			},
			
			textAlign: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.textAlign" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.textAlign" is not implemented yet.');
					return value;
				}
			},
			
			verticalAlign: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.TextField#.verticalAlign" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.TextField#.verticalAlign" is not implemented yet.');
					return value;
				}
			}
		}

	});

});
