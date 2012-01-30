define("Ti/UI/View",
	["Ti/_/declare", "Ti/_/dom", "Ti/_/UI/Element", "Ti/_/lang", "Ti/_/string", "Ti/_/Layouts"],
	function(declare, dom, Element, lang, string, Layouts) {

	return declare("Ti.UI.View", Element, {

		_parent: null,

		constructor: function() {
			this.children = [];
			this.layout = "absolute";
			this.containerNode = this.domNode;
		},

		add: function(view) {
			view._setParent(this);
			this.children.push(view);
			this.containerNode.appendChild(view.domNode);
			this._triggerLayout();
		},

		_setParent: function(view) {
			this._parent = view;
		},

		_insertAt: function(view,index) {
			if (index > this.children.length || index < 0) {
				return;
			} else if (index === this.children.length) {
				this.add(view);
			} else {
				view._parent = this;
				this.containerNode.insertBefore(view.domNode,this.children[index].domNode);
				this.children.splice(index,0,view);
			this._triggerLayout();
			}
		},

		remove: function(view) {
			var i = 0,
				l = this.children.length;
			for (; i < l; i++) {
				if (this.children[i] === view) {
					l = this.children.splice(i, 1);
					l[0]._setParent();
					break;
				}
			}
			dom.detach(view.domNode);
			this._triggerLayout();
		},
		
		_removeAllChildren: function(view) {
			var children = this.children;
			while(children.length > 0) {
				this.remove(children[0]);
			}
			this._triggerLayout();
		},

		destroy: function() {
			if (!this._destroyed) {
				var i = 0,
					l = this.children.length;
				for (; i < l; i++) {
					this.children[i].destroy();
					this.children[i] = null;
				}
				this.children = null;
				Element.prototype.destroy.apply(this, arguments);
			}
		},

		_defaultWidth: "100%",

		_defaultHeight: "100%",

		properties: {
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