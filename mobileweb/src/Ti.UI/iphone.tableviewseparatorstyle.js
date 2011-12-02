(function(api){

	// Properties
	Ti._5.prop(api, 'NONE', {
		get: function() { return 0; }
	});

	Ti._5.prop(api, 'SINGLE_LINE', {
		get: function() { return 1; }
	});

})(Ti._5.createClass('Titanium.UI.iPhone.TableViewSeparatorStyle'));