(function(api){
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, 'intent');

	Ti._5.prop(api, 'onCreateOptionsMenu');

	Ti._5.prop(api, 'onPrepareOptionsMenu');

	Ti._5.prop(api, 'requestedOrientation');

	// Methods
	api.finish = function(){
		console.debug('Method "Titanium.Android.Activity.finish" is not implemented yet.');
	};
	api.getIntent = function(){
		console.debug('Method "Titanium.Android.Activity.getIntent" is not implemented yet.');
	};
	api.getString = function(){
		console.debug('Method "Titanium.Android.Activity.getString" is not implemented yet.');
	};
	api.setRequestedOrientation = function(){
		console.debug('Method "Titanium.Android.Activity.setRequestedOrientation" is not implemented yet.');
	};
	api.setResult = function(){
		console.debug('Method "Titanium.Android.Activity.setResult" is not implemented yet.');
	};
	api.startActivity = function(){
		console.debug('Method "Titanium.Android.Activity.startActivity" is not implemented yet.');
	};
	api.startActivityForResult = function(){
		console.debug('Method "Titanium.Android.Activity.startActivityForResult" is not implemented yet.');
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