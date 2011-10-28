(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _STATE_PAUSED = null;
	Object.defineProperty(api, 'STATE_PAUSED', {
		get: function(){return _STATE_PAUSED;},
		set: function(val){return _STATE_PAUSED = val;}
	});

	var _STATE_PLAYING = null;
	Object.defineProperty(api, 'STATE_PLAYING', {
		get: function(){return _STATE_PLAYING;},
		set: function(val){return _STATE_PLAYING = val;}
	});

	var _STATE_STARTING = null;
	Object.defineProperty(api, 'STATE_STARTING', {
		get: function(){return _STATE_STARTING;},
		set: function(val){return _STATE_STARTING = val;}
	});

	var _STATE_STOPPED = null;
	Object.defineProperty(api, 'STATE_STOPPED', {
		get: function(){return _STATE_STOPPED;},
		set: function(val){return _STATE_STOPPED = val;}
	});

	var _STATE_STOPPING = null;
	Object.defineProperty(api, 'STATE_STOPPING', {
		get: function(){return _STATE_STOPPING;},
		set: function(val){return _STATE_STOPPING = val;}
	});

	var _STATE_WAITING_FOR_DATA = null;
	Object.defineProperty(api, 'STATE_WAITING_FOR_DATA', {
		get: function(){return _STATE_WAITING_FOR_DATA;},
		set: function(val){return _STATE_WAITING_FOR_DATA = val;}
	});

	var _STATE_WAITING_FOR_QUEUE = null;
	Object.defineProperty(api, 'STATE_WAITING_FOR_QUEUE', {
		get: function(){return _STATE_WAITING_FOR_QUEUE;},
		set: function(val){return _STATE_WAITING_FOR_QUEUE = val;}
	});

	var _allowBackground = null;
	Object.defineProperty(api, 'allowBackground', {
		get: function(){return _allowBackground;},
		set: function(val){return _allowBackground = val;}
	});

	var _bitRate = null;
	Object.defineProperty(api, 'bitRate', {
		get: function(){return _bitRate;},
		set: function(val){return _bitRate = val;}
	});

	var _idle = null;
	Object.defineProperty(api, 'idle', {
		get: function(){return _idle;},
		set: function(val){return _idle = val;}
	});

	var _paused = null;
	Object.defineProperty(api, 'paused', {
		get: function(){return _paused;},
		set: function(val){return _paused = val;}
	});

	var _playing = null;
	Object.defineProperty(api, 'playing', {
		get: function(){return _playing;},
		set: function(val){return _playing = val;}
	});

	var _progress = null;
	Object.defineProperty(api, 'progress', {
		get: function(){return _progress;},
		set: function(val){return _progress = val;}
	});

	var _state = null;
	Object.defineProperty(api, 'state', {
		get: function(){return _state;},
		set: function(val){return _state = val;}
	});

	var _url = null;
	Object.defineProperty(api, 'url', {
		get: function(){return _url;},
		set: function(val){return _url = val;}
	});

	var _waiting = null;
	Object.defineProperty(api, 'waiting', {
		get: function(){return _waiting;},
		set: function(val){return _waiting = val;}
	});

	// Methods
	api.pause = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.pause" is not implemented yet.');
	};
	api.setPaused = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.setPaused" is not implemented yet.');
	};
	api.setUrl = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.setUrl" is not implemented yet.');
	};
	api.start = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.start" is not implemented yet.');
	};
	api.stateDescription = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.stateDescription" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.AudioPlayer.stop" is not implemented yet.');
	};

	// Events
	api.addEventListener('change', function(){
		console.debug('Event "change" is not implemented yet.');
	});
	api.addEventListener('progress', function(){
		console.debug('Event "progress" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Media.AudioPlayer'));