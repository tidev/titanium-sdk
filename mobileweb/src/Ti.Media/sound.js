(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _allowBackground = null;
	Object.defineProperty(api, 'allowBackground', {
		get: function(){return _allowBackground;},
		set: function(val){return _allowBackground = val;}
	});

	var _duration = null;
	Object.defineProperty(api, 'duration', {
		get: function(){return _duration;},
		set: function(val){return _duration = val;}
	});

	var _looping = null;
	Object.defineProperty(api, 'looping', {
		get: function(){return _looping;},
		set: function(val){return _looping = val;}
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

	var _time = null;
	Object.defineProperty(api, 'time', {
		get: function(){return _time;},
		set: function(val){return _time = val;}
	});

	var _url = null;
	Object.defineProperty(api, 'url', {
		get: function(){return _url;},
		set: function(val){return _url = val;}
	});

	var _volume = null;
	Object.defineProperty(api, 'volume', {
		get: function(){return _volume;},
		set: function(val){return _volume = val;}
	});

	// Methods
	api.getTime = function(){
		console.debug('Method "Titanium.Media.Sound.getTime" is not implemented yet.');
	};
	api.getVolume = function(){
		console.debug('Method "Titanium.Media.Sound.getVolume" is not implemented yet.');
	};
	api.isLooping = function(){
		console.debug('Method "Titanium.Media.Sound.isLooping" is not implemented yet.');
	};
	api.isPaused = function(){
		console.debug('Method "Titanium.Media.Sound.isPaused" is not implemented yet.');
	};
	api.isPlaying = function(){
		console.debug('Method "Titanium.Media.Sound.isPlaying" is not implemented yet.');
	};
	api.pause = function(){
		console.debug('Method "Titanium.Media.Sound.pause" is not implemented yet.');
	};
	api.play = function(){
		console.debug('Method "Titanium.Media.Sound.play" is not implemented yet.');
	};
	api.release = function(){
		console.debug('Method "Titanium.Media.Sound.release" is not implemented yet.');
	};
	api.reset = function(){
		console.debug('Method "Titanium.Media.Sound.reset" is not implemented yet.');
	};
	api.setLooping = function(){
		console.debug('Method "Titanium.Media.Sound.setLooping" is not implemented yet.');
	};
	api.setPaused = function(){
		console.debug('Method "Titanium.Media.Sound.setPaused" is not implemented yet.');
	};
	api.setTime = function(){
		console.debug('Method "Titanium.Media.Sound.setTime" is not implemented yet.');
	};
	api.setVolume = function(){
		console.debug('Method "Titanium.Media.Sound.setVolume" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.Sound.stop" is not implemented yet.');
	};

	// Events
	api.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	api.addEventListener('error', function(){
		console.debug('Event "error" is not implemented yet.');
	});
	api.addEventListener('interrupted', function(){
		console.debug('Event "interrupted" is not implemented yet.');
	});
	api.addEventListener('resume', function(){
		console.debug('Event "resume" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Media.Sound'));