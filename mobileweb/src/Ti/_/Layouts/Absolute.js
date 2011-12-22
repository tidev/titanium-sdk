define("Ti/_/Layouts/Absolute", ["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Absolute", Base, {

		doLayout: function(element) {
			Base.prototype.doLayout.apply(this,[element,true]);
		}

	});

});
