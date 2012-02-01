define("Ti/_/Layouts/Base", ["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(css, declare, style, dom) {
	
	var unitize = dom.unitize,
		set = style.set,
		isDef = require.isDef,
		is = require.is,
		undef;

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		}

	});

});