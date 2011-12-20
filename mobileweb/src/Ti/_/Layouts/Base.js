define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare"], function(css, declare) {

	return declare("Base", null, {

		constuctor: function(view) {
			this.view = view;
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