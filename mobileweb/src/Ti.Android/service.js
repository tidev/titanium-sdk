(function(api){
	// Properties
	Ti._5.member(api, 'intent');

	Ti._5.member(api, 'serviceInstanceId');

	Ti._5.member(api, 'pause');

	Ti._5.member(api, 'resume');

	Ti._5.member(api, 'start');

	Ti._5.member(api, 'stop');

	// Methods
	api.start = function(){
		console.debug('Method "Titanium.Android.Service.start" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Android.Service.stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Android.Service'));