define(['Ti/_/declare', 'Ti/_/UI/Element', 'Ti/_/string', 'Ti/_/Layouts', 'Ti/UI'],
	function (declare, Element, string, Layouts, UI) {

	var layoutRegExp = /^horizontal|vertical|constrainingHorizontal|constrainingVertical$/;

	return declare('Ti.UI.View', Element, {

		constructor: function () {
			this.__values__.constants.children = [];
			this._setLayout();
			this.containerNode = this.domNode;
		},

		/**
		 * Marks a view as 'published,' meaning it will show up in {@link Ti#UI#View#children} and can be the source of
		 * UI events.
		 *
		 * @private
		 * @name Ti#UI#View#_markPublished
		 * @param {Ti.UI.View} view The view to mark as published.
		 */
		_publish: function (view) {
			this.children.push(view);
			view._isPublished = 1;
		},

		/**
		 * Marks a view as 'unpublished,' meaning it will <em>not</em> show up in {@link Ti#UI#View#children} and can
		 * <em>not</em> be the source of UI events.
		 *
		 * @private
		 * @name Ti#UI#View#_markPublished
		 * @param {Ti.UI.View} view The view to mark as unpublished.
		 */
		_unpublish: function (view) {
			var children = this.children,
				viewIdx = children.indexOf(view);
			~viewIdx && children.splice(viewIdx, 1);
		},

		add: function (view) {
			this._add(view);
			this._publish(view);
		},

		remove: function (view) {
			this._remove(view);
			this._unpublish(view);
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_setLayout: function (value) {
			value = layoutRegExp.test(value) ? value : 'composite';

			if (this._layout) {
				this._layout.destroy();
				this._layout = null;
			}

			this._layout = new Layouts[string.capitalize(value === 'horizontal' && !this.horizontalWrap ? 'constrainingHorizontal' : value)]({
				element: this
			});

			return value;
		},

		constants: {
			children: void 0
		},

		properties: {
			layout: {
				set: '_setLayout'
			},
			horizontalWrap: {
				post: function () {
					this.layout = this.layout; // Force a new layout to be created.
				},
				value: true
			}
		}

	});

});