(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'compression');

	Ti._5.member(api, 'format');

	Ti._5.member(api, 'paused');

	Ti._5.member(api, 'recording');

	Ti._5.member(api, 'stopped');

	// Methods
	api.pause = function(){
		console.debug('Method "Titanium.Media.AudioRecorder.pause" is not implemented yet.');
	};
	api.resume = function(){
		console.debug('Method "Titanium.Media.AudioRecorder.resume" is not implemented yet.');
	};
	api.start = function(){
		console.debug('Method "Titanium.Media.AudioRecorder.start" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.AudioRecorder.stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Media.AudioRecorder'));