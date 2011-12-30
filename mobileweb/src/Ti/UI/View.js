define("Ti/UI/View",
	["Ti/_/declare", "Ti/_/dom", "Ti/_/UI/Element", "Ti/_/lang", "Ti/_/string", "Ti/_/Layouts"],
	function(declare, dom, Element, lang, string, Layouts) {

	return declare("Ti.UI.View", Element, {

		parent: null,

		constructor: function() {
			this.children = [];
			this.layout = "absolute";
			this.containerNode = this.domNode;
		},

		add: function(view) {
			view.parent = this;
			this.children.push(view);
			this.containerNode.appendChild(view.domNode);
			Ti.UI._doFullLayout();
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
			dom.destroy(view.domNode);
			Ti.UI._doFullLayout();
		},
		
		destroy: function() {
			var i = 0,
				l = this.children.length;
			for (; i < l; i++) {
				this.children[i].destroy();
			}
			Element.prototype.destroy.apply(this, arguments);
		},

		properties: {
			_defaultWidth: "100%",
			_defaultHeight: "100%",
			layout: {
				set: function(value) {
					var match = value.toLowerCase().match(/^(horizontal|vertical)$/),
						value = match ? match[0] : "absolute";

					if (this._layout) {
						this._layout.destroy();
						this._layout = null;
					}

					this._layout = new Layouts[string.capitalize(value)](this);

					return value;
				}
			}
		}

	});

});