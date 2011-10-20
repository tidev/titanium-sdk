(function(api){
	Ti._5.EventDriven(api);
	// Properties
	var _currentPlaybackTime = null;
	Object.defineProperty(api, 'currentPlaybackTime', {
		get: function(){return _currentPlaybackTime;},
		set: function(val){return _currentPlaybackTime = val;}
	});

	var _nowPlaying = null;
	Object.defineProperty(api, 'nowPlaying', {
		get: function(){return _nowPlaying;},
		set: function(val){return _nowPlaying = val;}
	});

	var _playbackState = null;
	Object.defineProperty(api, 'playbackState', {
		get: function(){return _playbackState;},
		set: function(val){return _playbackState = val;}
	});

	var _repeatMode = null;
	Object.defineProperty(api, 'repeatMode', {
		get: function(){return _repeatMode;},
		set: function(val){return _repeatMode = val;}
	});

	var _shuffleMode = null;
	Object.defineProperty(api, 'shuffleMode', {
		get: function(){return _shuffleMode;},
		set: function(val){return _shuffleMode = val;}
	});

	var _volume = null;
	Object.defineProperty(api, 'volume', {
		get: function(){return _volume;},
		set: function(val){return _volume = val;}
	});

	// Methods
	api.pause = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..pause" is not implemented yet.');
	};
	api.play = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..play" is not implemented yet.');
	};
	api.seekBackward = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..seekBackward" is not implemented yet.');
	};
	api.seekForward = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..seekForward" is not implemented yet.');
	};
	api.setQueue = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..setQueue" is not implemented yet.');
	};
	api.skipToBeginning = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..skipToBeginning" is not implemented yet.');
	};
	api.skipToNext = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..skipToNext" is not implemented yet.');
	};
	api.skipToPrevious = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..skipToPrevious" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..stop" is not implemented yet.');
	};
	api.stopSeeking = function(){
		console.debug('Method "Titanium.Media.MusicPlayer..stopSeeking" is not implemented yet.');
	};

	// Events
	api.addEventListener('playingChange', function(){
		console.debug('Event "playingChange" is not implemented yet.');
	});
	api.addEventListener('stateChange', function(){
		console.debug('Event "stateChange" is not implemented yet.');
	});
	api.addEventListener('volumeChange', function(){
		console.debug('Event "volumeChange" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Media.MusicPlayer'));