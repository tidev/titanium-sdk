(function(api){
	// Properties
	Ti._5.prop(api, 'domain');

	Ti._5.prop(api, 'isLocal');

	Ti._5.prop(api, 'name');

	Ti._5.prop(api, 'socket');

	Ti._5.prop(api, 'type');

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