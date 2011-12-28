define("Ti/UI/Label", ["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, FontWidget, dom, css, style) {

	var set = style.set,
		undef;

	return declare("Ti.UI.Label", FontWidget, {
		
		constructor: function() {
			
			// Create the aligner div. This sets up a flexbox to float the text to the middle
			this.textAlignerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextAligner")
			});
			this.domNode.appendChild(this.textAlignerDiv);
			set(this.textAlignerDiv, "display", "-webkit-box");
			set(this.textAlignerDiv, "display", "-moz-box");
			set(this.textAlignerDiv, "boxOrient", "vertical");
			set(this.textAlignerDiv, "boxPack", "center");
			set(this.textAlignerDiv, "width", "100%");
			set(this.textAlignerDiv, "height", "100%");
			set(this.textAlignerDiv,"overflow","hidden");
			
			// Create the container div. This gets floated by the flexbox
			this.textContainerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextContainer")
			});
			this.textAlignerDiv.appendChild(this.textContainerDiv);
			set(this.textContainerDiv,"userSelect","none");
			this._addStyleableDomNode(this.textContainerDiv);
		},

		toImage: function(callback) {
			// TODO
		},
		
		properties: {
			_defaultWidth: "auto",
			_defaultHeight: "auto",
			color: {
				set: function(value) {
					this.textContainerDiv.style.color = value;
					return value;
				}
			},
			highlightedColor: undef,
			shadowColor: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Label#.shadowColor" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Label#.shadowColor" is not implemented yet.');
					return value;
				}
			},
			shadowOffset: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Label#.shadowOffset" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Label#.shadowOffset" is not implemented yet.');
					return value;
				}
			},
			text: {
				set: function(value) {
					this.textContainerDiv.innerHTML = value;
					return value;
				}
			},
			textAlign: {
				set: function(value) {
					this.textContainerDiv.style.textAlign = value;
					return value;
				}
			},
			textid: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Label#.textid" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Label#.textid" is not implemented yet.');
					return value;
				}
			},
			wordWrap: {
				get: function(value) {
					// TODO
					console.debug('Property "Titanium.UI.Label#.wordWrap" is not implemented yet.');
					return value;
				},
				set: function(value) {
					console.debug('Property "Titanium.UI.Label#.wordWrap" is not implemented yet.');
					return value;
				},
				value: false
			}
		}

	});

});