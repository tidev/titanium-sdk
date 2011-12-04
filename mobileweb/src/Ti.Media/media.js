(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.member(api, 'AUDIO_FILEFORMAT_3GP2');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_3GPP');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_AIFF');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_AMR');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_CAF');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_MP3');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_MP4');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_MP4A');

	Ti._5.member(api, 'AUDIO_FILEFORMAT_WAVE');

	Ti._5.member(api, 'AUDIO_FORMAT_AAC');

	Ti._5.member(api, 'AUDIO_FORMAT_ALAW');

	Ti._5.member(api, 'AUDIO_FORMAT_APPLE_LOSSLESS');

	Ti._5.member(api, 'AUDIO_FORMAT_ILBC');

	Ti._5.member(api, 'AUDIO_FORMAT_IMA4');

	Ti._5.member(api, 'AUDIO_FORMAT_LINEAR_PCM');

	Ti._5.member(api, 'AUDIO_FORMAT_ULAW');

	Ti._5.member(api, 'AUDIO_HEADPHONES');

	Ti._5.member(api, 'AUDIO_HEADPHONES_AND_MIC');

	Ti._5.member(api, 'AUDIO_HEADSET_INOUT');

	Ti._5.member(api, 'AUDIO_LINEOUT');

	Ti._5.member(api, 'AUDIO_MICROPHONE');

	Ti._5.member(api, 'AUDIO_MUTED');

	Ti._5.member(api, 'AUDIO_RECEIVER_AND_MIC');

	Ti._5.member(api, 'AUDIO_SESSION_MODE_AMBIENT');

	Ti._5.member(api, 'AUDIO_SESSION_MODE_PLAYBACK');

	Ti._5.member(api, 'AUDIO_SESSION_MODE_PLAY_AND_RECORD');

	Ti._5.member(api, 'AUDIO_SESSION_MODE_RECORD');

	Ti._5.member(api, 'AUDIO_SESSION_MODE_SOLO_AMBIENT');

	Ti._5.member(api, 'AUDIO_SPEAKER');

	Ti._5.member(api, 'AUDIO_UNAVAILABLE');

	Ti._5.member(api, 'AUDIO_UNKNOWN');

	Ti._5.member(api, 'DEVICE_BUSY');

	Ti._5.member(api, 'MEDIA_TYPE_PHOTO');

	Ti._5.member(api, 'MEDIA_TYPE_VIDEO');

	Ti._5.member(api, 'MUSIC_MEDIA_TYPE_ALL');

	Ti._5.member(api, 'MUSIC_MEDIA_TYPE_ANY_AUDIO');

	Ti._5.member(api, 'MUSIC_MEDIA_TYPE_AUDIOBOOK');

	Ti._5.member(api, 'MUSIC_MEDIA_TYPE_MUSIC');

	Ti._5.member(api, 'MUSIC_MEDIA_TYPE_PODCAST');

	Ti._5.member(api, 'MUSIC_PLAYER_REPEAT_ALL');

	Ti._5.member(api, 'MUSIC_PLAYER_REPEAT_DEFAULT');

	Ti._5.member(api, 'MUSIC_PLAYER_REPEAT_NONE');

	Ti._5.member(api, 'MUSIC_PLAYER_REPEAT_ONE');

	Ti._5.member(api, 'MUSIC_PLAYER_SHUFFLE_ALBUMS');

	Ti._5.member(api, 'MUSIC_PLAYER_SHUFFLE_DEFAULT');

	Ti._5.member(api, 'MUSIC_PLAYER_SHUFFLE_NONE');

	Ti._5.member(api, 'MUSIC_PLAYER_SHUFFLE_SONGS');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_INTERRUPTED');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_PAUSED');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_PLAYING');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_SEEK_BACKWARD');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_SKEEK_FORWARD');

	Ti._5.member(api, 'MUSIC_PLAYER_STATE_STOPPED');

	Ti._5.member(api, 'NO_CAMERA');

	Ti._5.member(api, 'NO_VIDEO');

	Ti._5.member(api, 'QUALITY_HIGH');

	Ti._5.member(api, 'QUALITY_LOW');

	Ti._5.member(api, 'QUALITY_MEDIUM');

	Ti._5.member(api, 'UNKNOWN_ERROR');

	Ti._5.member(api, 'VIDEO_CONTROL_DEFAULT');

	Ti._5.member(api, 'VIDEO_CONTROL_EMBEDDED');

	Ti._5.member(api, 'VIDEO_CONTROL_FULLSCREEN');

	Ti._5.member(api, 'VIDEO_CONTROL_HIDDEN');

	Ti._5.member(api, 'VIDEO_CONTROL_NONE');

	Ti._5.member(api, 'VIDEO_CONTROL_VOLUME_ONLY');

	Ti._5.member(api, 'VIDEO_FINISH_REASON_PLAYBACK_ENDED');

	Ti._5.member(api, 'VIDEO_FINISH_REASON_PLAYBACK_ERROR');

	Ti._5.member(api, 'VIDEO_FINISH_REASON_USER_EXITED');

	Ti._5.member(api, 'VIDEO_LOAD_STATE_PLAYABLE');

	Ti._5.member(api, 'VIDEO_LOAD_STATE_PLAYTHROUGH_OK');

	Ti._5.member(api, 'VIDEO_LOAD_STATE_STALLED');

	Ti._5.member(api, 'VIDEO_LOAD_STATE_UNKNOWN');

	Ti._5.member(api, 'VIDEO_MEDIA_TYPE_AUDIO');

	Ti._5.member(api, 'VIDEO_MEDIA_TYPE_NONE');

	Ti._5.member(api, 'VIDEO_MEDIA_TYPE_VIDEO');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_INTERRUPTED');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_PAUSED');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_PLAYING');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_SEEKING_FORWARD');

	Ti._5.member(api, 'VIDEO_PLAYBACK_STATE_STOPPED');

	Ti._5.member(api, 'VIDEO_REPEAT_MODE_NONE');

	Ti._5.member(api, 'VIDEO_REPEAT_MODE_ONE');

	Ti._5.member(api, 'VIDEO_SCALING_ASPECT_FILL');

	Ti._5.member(api, 'VIDEO_SCALING_ASPECT_FIT');

	Ti._5.member(api, 'VIDEO_SCALING_MODE_FILL');

	Ti._5.member(api, 'VIDEO_SCALING_NONE');

	Ti._5.member(api, 'VIDEO_SOURCE_TYPE_FILE');

	Ti._5.member(api, 'VIDEO_SOURCE_TYPE_STREAMING');

	Ti._5.member(api, 'VIDEO_SOURCE_TYPE_UNKNOWN');

	Ti._5.member(api, 'VIDEO_TIME_OPTION_EXACT');

	Ti._5.member(api, 'VIDEO_TIME_OPTION_NEAREST_KEYFRAME');

	Ti._5.member(api, 'appMusicPlayer');

	Ti._5.member(api, 'audioLineType');

	Ti._5.member(api, 'audioPlaying');

	Ti._5.member(api, 'audioSessionMode');

	Ti._5.member(api, 'availableCameraMediaTypes');

	Ti._5.member(api, 'availablePhotoGalleryMediaTypes');

	Ti._5.member(api, 'availablePhotoMediaTypes');

	Ti._5.member(api, 'averageMicrophonePower');

	Ti._5.member(api, 'canRecord');

	Ti._5.member(api, 'isCameraSupported');

	Ti._5.member(api, 'peakMicrophonePower');

	Ti._5.member(api, 'systemMusicPlayer');

	Ti._5.member(api, 'volume');

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
	api.createMusicPlayer = function(){
		console.debug('Method "Titanium.Media.createMusicPlayer" is not implemented yet.');
	};
	api.createSound = function(){
		console.debug('Method "Titanium.Media.createSound" is not implemented yet.');
	};
	api.createVideoPlayer = function(){
		console.debug('Method "Titanium.Media.createVideoPlayer" is not implemented yet.');
	};
	api.hideCamera = function(){
		console.debug('Method "Titanium.Media.hideCamera" is not implemented yet.');
	};
	api.hideMusicLibrary = function(){
		console.debug('Method "Titanium.Media.hideMusicLibrary" is not implemented yet.');
	};
	api.isMediaTypeSupported = function(){
		console.debug('Method "Titanium.Media.isMediaTypeSupported" is not implemented yet.');
	};
	api.openPhotoGallery = function(){
		console.debug('Method "Titanium.Media.openPhotoGallery" is not implemented yet.');
	};
	api.saveToPhotoGallery = function(){
		console.debug('Method "Titanium.Media.saveToPhotoGallery" is not implemented yet.');
	};
	api.showCamera = function(){
		console.debug('Method "Titanium.Media.showCamera" is not implemented yet.');
	};
	api.showMusicLibrary = function(){
		console.debug('Method "Titanium.Media.showMusicLibrary" is not implemented yet.');
	};
	api.startMicrophoneMonitor = function(){
		console.debug('Method "Titanium.Media.startMicrophoneMonitor" is not implemented yet.');
	};
	api.stopMicrophoneMonitor = function(){
		console.debug('Method "Titanium.Media.stopMicrophoneMonitor" is not implemented yet.');
	};
	api.takePicture = function(){
		console.debug('Method "Titanium.Media.takePicture" is not implemented yet.');
	};
	api.takeScreenshot = function(){
		console.debug('Method "Titanium.Media.takeScreenshot" is not implemented yet.');
	};
	api.vibrate = function(){
		console.debug('Method "Titanium.Media.vibrate" is not implemented yet.');
	};

	// Events
	api.addEventListener('linechange', function(){
		console.debug('Event "linechange" is not implemented yet.');
	});
	api.addEventListener('recordinginput', function(){
		console.debug('Event "recordinginput" is not implemented yet.');
	});
	api.addEventListener('volume', function(){
		console.debug('Event "volume" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Media'));