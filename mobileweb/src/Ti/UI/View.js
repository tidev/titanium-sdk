define("Ti/UI/View", ["Ti/_/declare", "Ti/_/dom", "Ti/_/Element", "Ti/_/text"], function(declare, dom, Element, text) {

	return declare("Ti.UI.View", Element, {

		parent: null,
		_layout: null,

		constructor: function() {
			this.children = [];
			this.layout = "absolute";
		},

		add: function(view) {
			this.children.push(view);
			view.parent = this;
		},

		remove: function(view) {
			var i = 0,
				l = this.children.length;
			for (; i < l; i++) {
				if (this.children[i] === view) {
					this.children.splice(i, 1);
					break;
				}
			}
			dom.destroy(this.domNode);
		},

		properties: {
			layout: {
				set: function(value) {
					var match = value.toLowerCase().match(/^(horizontal|vertical)$/),
						value = text.capitalize(match ? match[0] : "absolute");

					if (this._layout) {
						this._layout.destroy();
						this._layout = null;
					}

					this._layout = new Ti._.Layouts[value](this);

					return value;
				}
			}
		}

	});

});