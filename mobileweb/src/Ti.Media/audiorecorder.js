(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _compression = null;
	Object.defineProperty(api, 'compression', {
		get: function(){return _compression;},
		set: function(val){return _compression = val;}
	});

	var _format = null;
	Object.defineProperty(api, 'format', {
		get: function(){return _format;},
		set: function(val){return _format = val;}
	});

	var _paused = null;
	Object.defineProperty(api, 'paused', {
		get: function(){return _paused;},
		set: function(val){return _paused = val;}
	});

	var _recording = null;
	Object.defineProperty(api, 'recording', {
		get: function(){return _recording;},
		set: function(val){return _recording = val;}
	});

	var _stopped = null;
	Object.defineProperty(api, 'stopped', {
		get: function(){return _stopped;},
		set: function(val){return _stopped = val;}
	});

	// Methods
	api.pause = function(){
		console.debug('Method "Titanium.Media.AudioRecorder..pause" is not implemented yet.');
	};
	api.resume = function(){
		console.debug('Method "Titanium.Media.AudioRecorder..resume" is not implemented yet.');
	};
	api.start = function(){
		console.debug('Method "Titanium.Media.AudioRecorder..start" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.AudioRecorder..stop" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Media.AudioRecorder'));