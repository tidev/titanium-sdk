(function(api){
	Ti._5.EventDriven(api);

	// Properties
	var _intent = null;
	Object.defineProperty(api, 'intent', {
		get: function(){return _intent;},
		set: function(val){return _intent = val;}
	});

	var _onCreateOptionsMenu = null;
	Object.defineProperty(api, 'onCreateOptionsMenu', {
		get: function(){return _onCreateOptionsMenu;},
		set: function(val){return _onCreateOptionsMenu = val;}
	});

	var _onPrepareOptionsMenu = null;
	Object.defineProperty(api, 'onPrepareOptionsMenu', {
		get: function(){return _onPrepareOptionsMenu;},
		set: function(val){return _onPrepareOptionsMenu = val;}
	});

	var _requestedOrientation = null;
	Object.defineProperty(api, 'requestedOrientation', {
		get: function(){return _requestedOrientation;},
		set: function(val){return _requestedOrientation = val;}
	});

	// Methods
	api.finish = function(){
		console.debug('Method "Titanium.Android.Activity..finish" is not implemented yet.');
	};
	api.getIntent = function(){
		console.debug('Method "Titanium.Android.Activity..getIntent" is not implemented yet.');
	};
	api.getString = function(){
		console.debug('Method "Titanium.Android.Activity..getString" is not implemented yet.');
	};
	api.setRequestedOrientation = function(){
		console.debug('Method "Titanium.Android.Activity..setRequestedOrientation" is not implemented yet.');
	};
	api.setResult = function(){
		console.debug('Method "Titanium.Android.Activity..setResult" is not implemented yet.');
	};
	api.startActivity = function(){
		console.debug('Method "Titanium.Android.Activity..startActivity" is not implemented yet.');
	};
	api.startActivityForResult = function(){
		console.debug('Method "Titanium.Android.Activity..startActivityForResult" is not implemented yet.');
	};

	// Events
	api.addEventListener('create', function(){
		console.debug('Event "create" is not implemented yet.');
	});
	api.addEventListener('destroy', function(){
		console.debug('Event "destroy" is not implemented yet.');
	});
	api.addEventListener('pause', function(){
		console.debug('Event "pause" is not implemented yet.');
	});
	api.addEventListener('resume', function(){
		console.debug('Event "resume" is not implemented yet.');
	});
	api.addEventListener('start', function(){
		console.debug('Event "start" is not implemented yet.');
	});
	api.addEventListener('stop', function(){
		console.debug('Event "stop" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Android.Activity'));