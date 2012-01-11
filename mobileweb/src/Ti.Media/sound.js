(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, {
		allowBackground: null,
		duration: null,
		looping: null,
		paused: null,
		playing: null,
		time: null,
		url: null,
		volume: null
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
	api.addEventListener("complete", function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	api.addEventListener("error", function(){
		console.debug('Event "error" is not implemented yet.');
	});
	api.addEventListener("interrupted", function(){
		console.debug('Event "interrupted" is not implemented yet.');
	});
	api.addEventListener("resume", function(){
		console.debug('Event "resume" is not implemented yet.');
	});
})(Ti._5.createClass("Ti.Media.Sound"));