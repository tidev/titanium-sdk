(function(api){
	// Properties
	Object.defineProperty(api, 'BLUE', {
		value: {selectedBackgroundColor: 'blue'},
		writable: false
	});
	Object.defineProperty(api, 'GRAY', {
		value: {selectedBackgroundColor: 'gray'},
		writable: false
	});
	Object.defineProperty(api, 'NONE', {
		value: {selectedColor: '', selectedBackgroundImage: '', selectedBackgroundColor: ''},
		writable: false
	});

})(Ti._5.createClass('Titanium.UI.iPhone.TableViewCellSelectionStyle'));