(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.propReadOnly(api, {
		UNKNOWN_ERROR: 0,
		DEVICE_BUSY: 1,
		NO_CAMERA: 2,
		NO_VIDEO: 3,

		VIDEO_CONTROL_DEFAULT: 4,
		VIDEO_CONTROL_EMBEDDED: 5,
		VIDEO_CONTROL_FULLSCREEN: 6,
		VIDEO_CONTROL_NONE: 7,
		VIDEO_CONTROL_HIDDEN: 8,

		VIDEO_SCALING_NONE: 9,
		VIDEO_SCALING_ASPECT_FILL: 10,
		VIDEO_SCALING_ASPECT_FIT: 11,
		VIDEO_SCALING_MODE_FILL: 12,

		VIDEO_PLAYBACK_STATE_STOPPED: 13,
		VIDEO_PLAYBACK_STATE_PLAYING: 14,
		VIDEO_PLAYBACK_STATE_PAUSED: 15,

		VIDEO_LOAD_STATE_PLAYABLE: 16,
		VIDEO_LOAD_STATE_PLAYTHROUGH_OK: 17,
		VIDEO_LOAD_STATE_STALLED: 18,
		VIDEO_LOAD_STATE_UNKNOWN: 19,

		VIDEO_REPEAT_MODE_NONE: 20,
		VIDEO_REPEAT_MODE_ONE: 21,

		VIDEO_FINISH_REASON_PLAYBACK_ENDED: 22,
		VIDEO_FINISH_REASON_PLAYBACK_ERROR: 23,
		VIDEO_FINISH_REASON_USER_EXITED: 24
	});

	// Methods
	api.beep = function(){
		console.debug('Method "Titanium.Media.beep" is not implemented yet.');
	};
	api.createAudioPlayer = function(){
		console.debug('Method "Titanium.Media.createAudioPlayer" is not implemented yet.');
	};
	api.createAudioRecorder = function(){
		console.debug('Method "Titanium.Media.createAudioRecorder" is not implemented yet.');
	};
	api.createItem = function(){
		console.debug('Method "Titanium.Media.createItem" is not implemented yet.');
	};
	api.createSound = function(){
		console.debug('Method "Titanium.Media.createSound" is not implemented yet.');
	};
	api.createVideoPlayer = function(args){
		return new Ti.Media.VideoPlayer(args);
	};
})(Ti._5.createClass("Ti.Media"));