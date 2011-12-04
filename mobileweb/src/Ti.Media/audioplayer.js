(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'STATE_PAUSED');

	Ti._5.member(api, 'STATE_PLAYING');

	Ti._5.member(api, 'STATE_STARTING');

	Ti._5.member(api, 'STATE_STOPPED');

	Ti._5.member(api, 'STATE_STOPPING');

	Ti._5.member(api, 'STATE_WAITING_FOR_DATA');

	Ti._5.member(api, 'STATE_WAITING_FOR_QUEUE');

	Ti._5.member(api, 'allowBackground');

	Ti._5.member(api, 'bitRate');

	Ti._5.member(api, 'idle');

	Ti._5.member(api, 'paused');

	Ti._5.member(api, 'playing');

	Ti._5.member(api, 'progress');

	Ti._5.member(api, 'state');

	Ti._5.member(api, 'url');

	Ti._5.member(api, 'waiting');

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