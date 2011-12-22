define("Ti/UI/Label", ["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style"], function(declare, Widget, dom, css, style) {

	var undef;

	return declare("Ti.UI.Label", Widget, {
		
		constructor: function() {
			
			// Create the aligner div. This sets up a flexbox to float the text to the middle
			this.textAlignerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextAligner")
			});
			this.domNode.appendChild(this.textAlignerDiv);
			style.set(this.textAlignerDiv, "display", "-webkit-box");
			style.set(this.textAlignerDiv, "display", "-moz-box");
			style.set(this.textAlignerDiv, "boxOrient", "vertical");
			style.set(this.textAlignerDiv, "boxPack", "center");
			style.set(this.textAlignerDiv, "width", "100%");
			style.set(this.textAlignerDiv, "height", "100%");
			
			// Create the container div. This gets floated by the flexbox
			this.textContainerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextContainer")
			});
			this.textAlignerDiv.appendChild(this.textContainerDiv);
		},

		toImage: function(callback) {
			// TODO
		},
		
		properties: {
			color: {
				set: function(value) {
					this.textContainerDiv.style.color = value;
					return value;
				}
			},
			highlightedColor: undef,
			shadowColor: {
				set: function(value) {
					return value;
				}
			},
			shadowOffset: {
				set: function(value) {
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
			textid: undef,
			wordWrap: {
				set: function(value) {
					return value;
				}
			}
		}

	});

});