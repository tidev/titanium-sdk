(function(api){
	// Properties
	Ti._5.prop(api, 'intent');

	Ti._5.prop(api, 'serviceInstanceId');

	Ti._5.prop(api, 'pause');

	Ti._5.prop(api, 'resume');

	Ti._5.prop(api, 'start');

	Ti._5.prop(api, 'stop');

	// Methods
	api.start = function(){
		console.debug('Method "Titanium.Android.Service.start" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Android.Service.stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Service'));