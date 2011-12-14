(function(api){
	// Properties
	Ti._5.prop(api, {
		domain: null,
		isLocal: null,
		name: null,
		socket: null,
		type: null
	});

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
})(Ti._5.createClass('Ti.Network.BonjourService'));