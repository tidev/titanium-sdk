define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare"], function(css, declare) {

	return declare("Ti._.Layouts.Base", null, {

		constuctor: function(element) {
			this.element = element;
			css.add(view.domNode, this.className = "ti" + this.declaredClass + "Layout");
		},

		destroy: function() {
			css.remove(this.view.domNode, this.className);
		},

		doLayout: function() {
			// stub
		}

	});

});