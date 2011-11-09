(function(api){
	// Properties
	var _domain = null;
	Object.defineProperty(api, 'domain', {
		get: function(){return _domain;},
		set: function(val){return _domain = val;}
	});

	var _isLocal = null;
	Object.defineProperty(api, 'isLocal', {
		get: function(){return _isLocal;},
		set: function(val){return _isLocal = val;}
	});

	var _name = null;
	Object.defineProperty(api, 'name', {
		get: function(){return _name;},
		set: function(val){return _name = val;}
	});

	var _socket = null;
	Object.defineProperty(api, 'socket', {
		get: function(){return _socket;},
		set: function(val){return _socket = val;}
	});

	var _type = null;
	Object.defineProperty(api, 'type', {
		get: function(){return _type;},
		set: function(val){return _type = val;}
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
})(Ti._5.createClass('Titanium.Network.BonjourService'));