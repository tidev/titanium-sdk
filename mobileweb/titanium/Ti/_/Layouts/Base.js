define(["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(css, declare, style, dom) {

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},
		
		verifyChild: function(child, parent) {
			if (!child._alive || !child.domNode) {
				console.debug("WARNING: Attempting to layout element that has been destroyed.\n\t Removing the element from the parent.\n\t The parent has a widget ID of " + parent.widgetId + ".");
				var children = parent.children;
				children.splice(children.indexOf(child),1);
				return;
			}
			return 1;
		},
		
		_computedSize: {width: 0, height: 0}

	});

});