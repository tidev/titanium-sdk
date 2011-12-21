define("Ti/Utils", ["Ti/_/Evented"], function(Evented) {

	(function(api){
		// Interfaces
		Ti._5.EventDriven(api);
	
		// Properties
		Ti._5.prop(api, {
			STATE_STOPPED: 0,
			STATE_STOPPING: 1,
			STATE_STARTING: 2,
			STATE_PLAYING: 3,
			STATE_PAUSED: 4,
			STATE_WAITING_FOR_DATA: 5,
			STATE_WAITING_FOR_QUEUE: 6,
			allowBackground: null,
			bitRate: null,
			idle: null,
			paused: null,
			playing: null,
			progress: null,
			state: null,
			url: null,
			waiting: null
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
		/* TODO: these should be *defining* events, not listening for them
		api.addEventListener('change', function(){
			console.debug('Event "change" is not implemented yet.');
		});
		api.addEventListener('progress', function(){
			console.debug('Event "progress" is not implemented yet.');
		});
		*/
	})(Ti._5.createClass("Ti.Media.AudioPlayer"));
	
});