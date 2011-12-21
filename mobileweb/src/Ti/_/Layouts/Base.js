define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare"], function(css, declare) {

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this._element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this._element.domNode, css.clean(this.declaredClass));
		},

		doLayout: function() {
			// stub
		}

	});

});