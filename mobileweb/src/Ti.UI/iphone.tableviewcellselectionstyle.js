(function(api){
	// Properties
	Ti._5.prop(api, 'BLUE', {
		get: function() { return {selectedBackgroundColor: 'blue'}; }
	});
	Ti._5.prop(api, 'GRAY', {
		get: function() { return {selectedBackgroundColor: 'gray'}; }
	});
	Ti._5.prop(api, 'NONE', {
		get: function() { return {selectedColor: '', selectedBackgroundImage: '', selectedBackgroundColor: ''}; }
	});

})(Ti._5.createClass('Titanium.UI.iPhone.TableViewCellSelectionStyle'));