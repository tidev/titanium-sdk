(function(api){
	// Properties
	var _intent = null;
	Object.defineProperty(api, 'intent', {
		get: function(){return _intent;},
		set: function(val){return _intent = val;}
	});

	var _serviceInstanceId = null;
	Object.defineProperty(api, 'serviceInstanceId', {
		get: function(){return _serviceInstanceId;},
		set: function(val){return _serviceInstanceId = val;}
	});

	var _pause = null;
	Object.defineProperty(api, 'pause', {
		get: function(){return _pause;},
		set: function(val){return _pause = val;}
	});

	var _resume = null;
	Object.defineProperty(api, 'resume', {
		get: function(){return _resume;},
		set: function(val){return _resume = val;}
	});

	var _start = null;
	Object.defineProperty(api, 'start', {
		get: function(){return _start;},
		set: function(val){return _start = val;}
	});

	var _stop = null;
	Object.defineProperty(api, 'stop', {
		get: function(){return _stop;},
		set: function(val){return _stop = val;}
	});

	// Methods
	api.start = function(){
		console.debug('Method "Titanium.Android.Service..start" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Android.Service..stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Service'));