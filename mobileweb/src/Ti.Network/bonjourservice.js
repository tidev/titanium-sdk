(function(api){
	// Properties
	Ti._5.member(api, 'domain');

	Ti._5.member(api, 'isLocal');

	Ti._5.member(api, 'name');

	Ti._5.member(api, 'socket');

	Ti._5.member(api, 'type');

	// Methods
	api.publish = function(){
		console.debug('Method "Titanium.Network.BonjourService.publish" is not implemented yet.');
	};
	api.resolve = function(){
		console.debug('Method "Titanium.Network.BonjourService.resolve" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Network.BonjourService.stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Network.BonjourService'));