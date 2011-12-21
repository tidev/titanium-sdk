define("Ti/_/Layouts/Horizontal", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		doLayout: function(element) {
			
			// Call the super method to layout the children
			Base.prototype.doLayout.apply(this, arguments);
			
			// Layout this node
			// TODO
		}

	});

});
