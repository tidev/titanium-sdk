define("Ti/Media/AudioRecorder", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		// Properties
		Ti._5.prop(api, {
			compression: null,
			format: null,
			paused: null,
			recording: null,
			stopped: null
		});
	
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
	})(Ti._5.createClass('Ti.Media.AudioRecorder'));
	
});