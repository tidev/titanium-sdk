(function(api){
	// Properties
	Ti._5.prop(api, 'BIG', {
		get: function() { return 3;}
	});

	Ti._5.prop(api, 'DARK', {
		get: function() { return 2;}
	});

	Ti._5.prop(api, 'PLAIN', {
		get: function() { return 1;}
	});

})(Ti._5.createClass('Titanium.UI.iPhone.ActivityIndicatorStyle'));
