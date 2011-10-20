(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _domain = null;
	Object.defineProperty(api, 'domain', {
		get: function(){return _domain;},
		set: function(val){return _domain = val;}
	});

	var _isSearching = null;
	Object.defineProperty(api, 'isSearching', {
		get: function(){return _isSearching;},
		set: function(val){return _isSearching = val;}
	});

	var _serviceType = null;
	Object.defineProperty(api, 'serviceType', {
		get: function(){return _serviceType;},
		set: function(val){return _serviceType = val;}
	});

	// Methods
	api.search = function(){
		console.debug('Method "Titanium.Network.BonjourBrowser..search" is not implemented yet.');
	};
	api.stopSearch = function(){
		console.debug('Method "Titanium.Network.BonjourBrowser..stopSearch" is not implemented yet.');
	};

	// Events
	api.addEventListener('event', function(){
		console.debug('Event "event" is not implemented yet.');
	});
	api.addEventListener('services', function(){
		console.debug('Event "services" is not implemented yet.');
	});
	api.addEventListener('updatedServices', function(){
		console.debug('Event "updatedServices" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Network.BonjourBrowser'));