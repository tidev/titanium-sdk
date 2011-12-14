(function(api){
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, {
		currentPlaybackTime: null,
		nowPlaying: null,
		playbackState: null,
		repeatMode: null,
		shuffleMode: null,
		volume: null
	});

	// Methods
	api.pause = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.pause" is not implemented yet.');
	};
	api.play = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.play" is not implemented yet.');
	};
	api.seekBackward = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.seekBackward" is not implemented yet.');
	};
	api.seekForward = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.seekForward" is not implemented yet.');
	};
	api.setQueue = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.setQueue" is not implemented yet.');
	};
	api.skipToBeginning = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.skipToBeginning" is not implemented yet.');
	};
	api.skipToNext = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.skipToNext" is not implemented yet.');
	};
	api.skipToPrevious = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.skipToPrevious" is not implemented yet.');
	};
	api.stop = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.stop" is not implemented yet.');
	};
	api.stopSeeking = function(){
		console.debug('Method "Titanium.Media.MusicPlayer.stopSeeking" is not implemented yet.');
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
})(Ti._5.createClass("Ti.Media.MusicPlayer"));