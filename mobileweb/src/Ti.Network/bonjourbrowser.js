(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'domain');

	Ti._5.member(api, 'isSearching');

	Ti._5.member(api, 'serviceType');

	// Methods
	api.search = function(){
		console.debug('Method "Titanium.Network.BonjourBrowser.search" is not implemented yet.');
	};
	api.stopSearch = function(){
		console.debug('Method "Titanium.Network.BonjourBrowser.stopSearch" is not implemented yet.');
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