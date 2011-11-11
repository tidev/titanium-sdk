(function(api){
	// Properties
	Object.defineProperty(api, 'BIG', {
		value: 3,
		writable: false
	});

	Object.defineProperty(api, 'DARK', {
		value: 2,
		writable: false
	});

	Object.defineProperty(api, 'PLAIN', {
		value: 1,
		writable: false
	});

})(Ti._5.createClass('Titanium.UI.iPhone.ActivityIndicatorStyle'));
