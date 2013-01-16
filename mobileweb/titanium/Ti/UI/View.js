define(["Ti/_/declare", "Ti/_/dom", "Ti/_/UI/Element", "Ti/_/lang", "Ti/_/string", "Ti/_/Layouts", "Ti/_/style", "Ti/UI"],
	function(declare, dom, Element, lang, string, Layouts, style, UI) {

	return declare("Ti.UI.View", Element, {

		constructor: function() {
			this.constants.__values__.children = [];
			this.layout = "composite";
			this.containerNode = this.domNode;
		},

		/**
		 * Marks a view as "published," meaning it will show up in {@link Ti#UI#View#children} and can be the source of
		 * UI events.
		 *
		 * @private
		 * @name Ti#UI#View#_markPublished
		 * @param {Ti.UI.View} view The view to mark as published.
		 */
		_publish: function(view) {
			this.children.push(view);
			view._isPublished = 1;
		},

		/**
		 * Marks a view as "unpublished," meaning it will <em>not</em> show up in {@link Ti#UI#View#children} and can
		 * <em>not</em> be the source of UI events.
		 *
		 * @private
		 * @name Ti#UI#View#_markPublished
		 * @param {Ti.UI.View} view The view to mark as unpublished.
		 */
		_unpublish: function(view) {
			var children = this.children,
				viewIdx = children.indexOf(view);
			~viewIdx && children.splice(viewIdx,1);
		},

		add: function(view) {
			this._add(view);
			this._publish(view);
		},

		remove: function(view) {
			this._remove(view);
			this._unpublish(view);
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		constants: {
			children: void 0
		},

		properties: {
			layout: {
				set: function(value) {
					var match = value.match(/^(horizontal|vertical|constrainingHorizontal|constrainingVertical)$/);
					value = match ? match[0] : "composite";

					if (this._layout) {
						this._layout.destroy();
						this._layout = null;
					}

					this._layout = new Layouts[string.capitalize(value === "horizontal" && !this.horizontalWrap ? "constrainingHorizontal" : value)](this);

					return value;
				}
			},
			horizontalWrap: {
				post: function() {
					this.layout = this.layout; // Force a new layout to be created.
				},
				value: true
			}
		}

	});

});