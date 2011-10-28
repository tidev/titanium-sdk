(function(api){
	// Properties
	var _items = null;
	Object.defineProperty(api, 'items', {
		get: function(){return _items;},
		set: function(val){return _items = val;}
	});

	// Methods
	api.add = function(){
		console.debug('Method "Titanium.Android.Menu.add" is not implemented yet.');
	};
	api.clear = function(){
		console.debug('Method "Titanium.Android.Menu.clear" is not implemented yet.');
	};
	api.close = function(){
		console.debug('Method "Titanium.Android.Menu.close" is not implemented yet.');
	};
	api.findItem = function(){
		console.debug('Method "Titanium.Android.Menu.findItem" is not implemented yet.');
	};
	api.getItem = function(){
		console.debug('Method "Titanium.Android.Menu.getItem" is not implemented yet.');
	};
	api.hasVisibleItems = function(){
		console.debug('Method "Titanium.Android.Menu.hasVisibleItems" is not implemented yet.');
	};
	api.removeGroup = function(){
		console.debug('Method "Titanium.Android.Menu.removeGroup" is not implemented yet.');
	};
	api.removeItem = function(){
		console.debug('Method "Titanium.Android.Menu.removeItem" is not implemented yet.');
	};
	api.setGroupEnabled = function(){
		console.debug('Method "Titanium.Android.Menu.setGroupEnabled" is not implemented yet.');
	};
	api.setGroupVisible = function(){
		console.debug('Method "Titanium.Android.Menu.setGroupVisible" is not implemented yet.');
	};
	api.size = function(){
		console.debug('Method "Titanium.Android.Menu.size" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Menu'));