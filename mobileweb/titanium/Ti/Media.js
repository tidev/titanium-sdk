define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.setObject("Ti.Media", Evented, {

		constants: {
			UNKNOWN_ERROR: 0,
			DEVICE_BUSY: 1,
			NO_CAMERA: 2,
			NO_VIDEO: 3,

			VIDEO_CONTROL_DEFAULT: 1,
			VIDEO_CONTROL_EMBEDDED: 1,
			VIDEO_CONTROL_FULLSCREEN: 2,
			VIDEO_CONTROL_NONE: 0,
			VIDEO_CONTROL_HIDDEN: 0,

			VIDEO_SCALING_NONE: 0,
			VIDEO_SCALING_ASPECT_FILL: 2,
			VIDEO_SCALING_ASPECT_FIT: 1,
			VIDEO_SCALING_MODE_FILL: 3,

			VIDEO_PLAYBACK_STATE_STOPPED: 0,
			VIDEO_PLAYBACK_STATE_PLAYING: 1,
			VIDEO_PLAYBACK_STATE_PAUSED: 2,

			VIDEO_LOAD_STATE_PLAYABLE: 1,
			VIDEO_LOAD_STATE_PLAYTHROUGH_OK: 2,
			VIDEO_LOAD_STATE_STALLED: 4,
			VIDEO_LOAD_STATE_UNKNOWN: 0,

			VIDEO_REPEAT_MODE_NONE: 0,
			VIDEO_REPEAT_MODE_ONE: 1,

			VIDEO_FINISH_REASON_PLAYBACK_ENDED: 0,
			VIDEO_FINISH_REASON_PLAYBACK_ERROR: 1,
			VIDEO_FINISH_REASON_USER_EXITED: 2
		},

		beep: function() {
			console.debug('Method "Titanium.Media.beep" is not implemented yet.');
		},

		createAudioPlayer: function() {
			console.debug('Method "Titanium.Media.createAudioPlayer" is not implemented yet.');
		},

		createAudioRecorder: function() {
			console.debug('Method "Titanium.Media.createAudioRecorder" is not implemented yet.');
		},

		createItem: function() {
			console.debug('Method "Titanium.Media.createItem" is not implemented yet.');
		},

		createSound: function() {
			console.debug('Method "Titanium.Media.createSound" is not implemented yet.');
		},

		createVideoPlayer: function(args) {
			var VideoPlayer = require("Ti/Media/VideoPlayer");
			return new VideoPlayer(args);
		}

	});
	
});