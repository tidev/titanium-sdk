(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _AUDIO_FILEFORMAT_3GP2 = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_3GP2', {
		get: function(){return _AUDIO_FILEFORMAT_3GP2;},
		set: function(val){return _AUDIO_FILEFORMAT_3GP2 = val;}
	});

	var _AUDIO_FILEFORMAT_3GPP = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_3GPP', {
		get: function(){return _AUDIO_FILEFORMAT_3GPP;},
		set: function(val){return _AUDIO_FILEFORMAT_3GPP = val;}
	});

	var _AUDIO_FILEFORMAT_AIFF = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_AIFF', {
		get: function(){return _AUDIO_FILEFORMAT_AIFF;},
		set: function(val){return _AUDIO_FILEFORMAT_AIFF = val;}
	});

	var _AUDIO_FILEFORMAT_AMR = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_AMR', {
		get: function(){return _AUDIO_FILEFORMAT_AMR;},
		set: function(val){return _AUDIO_FILEFORMAT_AMR = val;}
	});

	var _AUDIO_FILEFORMAT_CAF = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_CAF', {
		get: function(){return _AUDIO_FILEFORMAT_CAF;},
		set: function(val){return _AUDIO_FILEFORMAT_CAF = val;}
	});

	var _AUDIO_FILEFORMAT_MP3 = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_MP3', {
		get: function(){return _AUDIO_FILEFORMAT_MP3;},
		set: function(val){return _AUDIO_FILEFORMAT_MP3 = val;}
	});

	var _AUDIO_FILEFORMAT_MP4 = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_MP4', {
		get: function(){return _AUDIO_FILEFORMAT_MP4;},
		set: function(val){return _AUDIO_FILEFORMAT_MP4 = val;}
	});

	var _AUDIO_FILEFORMAT_MP4A = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_MP4A', {
		get: function(){return _AUDIO_FILEFORMAT_MP4A;},
		set: function(val){return _AUDIO_FILEFORMAT_MP4A = val;}
	});

	var _AUDIO_FILEFORMAT_WAVE = null;
	Object.defineProperty(api, 'AUDIO_FILEFORMAT_WAVE', {
		get: function(){return _AUDIO_FILEFORMAT_WAVE;},
		set: function(val){return _AUDIO_FILEFORMAT_WAVE = val;}
	});

	var _AUDIO_FORMAT_AAC = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_AAC', {
		get: function(){return _AUDIO_FORMAT_AAC;},
		set: function(val){return _AUDIO_FORMAT_AAC = val;}
	});

	var _AUDIO_FORMAT_ALAW = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_ALAW', {
		get: function(){return _AUDIO_FORMAT_ALAW;},
		set: function(val){return _AUDIO_FORMAT_ALAW = val;}
	});

	var _AUDIO_FORMAT_APPLE_LOSSLESS = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_APPLE_LOSSLESS', {
		get: function(){return _AUDIO_FORMAT_APPLE_LOSSLESS;},
		set: function(val){return _AUDIO_FORMAT_APPLE_LOSSLESS = val;}
	});

	var _AUDIO_FORMAT_ILBC = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_ILBC', {
		get: function(){return _AUDIO_FORMAT_ILBC;},
		set: function(val){return _AUDIO_FORMAT_ILBC = val;}
	});

	var _AUDIO_FORMAT_IMA4 = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_IMA4', {
		get: function(){return _AUDIO_FORMAT_IMA4;},
		set: function(val){return _AUDIO_FORMAT_IMA4 = val;}
	});

	var _AUDIO_FORMAT_LINEAR_PCM = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_LINEAR_PCM', {
		get: function(){return _AUDIO_FORMAT_LINEAR_PCM;},
		set: function(val){return _AUDIO_FORMAT_LINEAR_PCM = val;}
	});

	var _AUDIO_FORMAT_ULAW = null;
	Object.defineProperty(api, 'AUDIO_FORMAT_ULAW', {
		get: function(){return _AUDIO_FORMAT_ULAW;},
		set: function(val){return _AUDIO_FORMAT_ULAW = val;}
	});

	var _AUDIO_HEADPHONES = null;
	Object.defineProperty(api, 'AUDIO_HEADPHONES', {
		get: function(){return _AUDIO_HEADPHONES;},
		set: function(val){return _AUDIO_HEADPHONES = val;}
	});

	var _AUDIO_HEADPHONES_AND_MIC = null;
	Object.defineProperty(api, 'AUDIO_HEADPHONES_AND_MIC', {
		get: function(){return _AUDIO_HEADPHONES_AND_MIC;},
		set: function(val){return _AUDIO_HEADPHONES_AND_MIC = val;}
	});

	var _AUDIO_HEADSET_INOUT = null;
	Object.defineProperty(api, 'AUDIO_HEADSET_INOUT', {
		get: function(){return _AUDIO_HEADSET_INOUT;},
		set: function(val){return _AUDIO_HEADSET_INOUT = val;}
	});

	var _AUDIO_LINEOUT = null;
	Object.defineProperty(api, 'AUDIO_LINEOUT', {
		get: function(){return _AUDIO_LINEOUT;},
		set: function(val){return _AUDIO_LINEOUT = val;}
	});

	var _AUDIO_MICROPHONE = null;
	Object.defineProperty(api, 'AUDIO_MICROPHONE', {
		get: function(){return _AUDIO_MICROPHONE;},
		set: function(val){return _AUDIO_MICROPHONE = val;}
	});

	var _AUDIO_MUTED = null;
	Object.defineProperty(api, 'AUDIO_MUTED', {
		get: function(){return _AUDIO_MUTED;},
		set: function(val){return _AUDIO_MUTED = val;}
	});

	var _AUDIO_RECEIVER_AND_MIC = null;
	Object.defineProperty(api, 'AUDIO_RECEIVER_AND_MIC', {
		get: function(){return _AUDIO_RECEIVER_AND_MIC;},
		set: function(val){return _AUDIO_RECEIVER_AND_MIC = val;}
	});

	var _AUDIO_SESSION_MODE_AMBIENT = null;
	Object.defineProperty(api, 'AUDIO_SESSION_MODE_AMBIENT', {
		get: function(){return _AUDIO_SESSION_MODE_AMBIENT;},
		set: function(val){return _AUDIO_SESSION_MODE_AMBIENT = val;}
	});

	var _AUDIO_SESSION_MODE_PLAYBACK = null;
	Object.defineProperty(api, 'AUDIO_SESSION_MODE_PLAYBACK', {
		get: function(){return _AUDIO_SESSION_MODE_PLAYBACK;},
		set: function(val){return _AUDIO_SESSION_MODE_PLAYBACK = val;}
	});

	var _AUDIO_SESSION_MODE_PLAY_AND_RECORD = null;
	Object.defineProperty(api, 'AUDIO_SESSION_MODE_PLAY_AND_RECORD', {
		get: function(){return _AUDIO_SESSION_MODE_PLAY_AND_RECORD;},
		set: function(val){return _AUDIO_SESSION_MODE_PLAY_AND_RECORD = val;}
	});

	var _AUDIO_SESSION_MODE_RECORD = null;
	Object.defineProperty(api, 'AUDIO_SESSION_MODE_RECORD', {
		get: function(){return _AUDIO_SESSION_MODE_RECORD;},
		set: function(val){return _AUDIO_SESSION_MODE_RECORD = val;}
	});

	var _AUDIO_SESSION_MODE_SOLO_AMBIENT = null;
	Object.defineProperty(api, 'AUDIO_SESSION_MODE_SOLO_AMBIENT', {
		get: function(){return _AUDIO_SESSION_MODE_SOLO_AMBIENT;},
		set: function(val){return _AUDIO_SESSION_MODE_SOLO_AMBIENT = val;}
	});

	var _AUDIO_SPEAKER = null;
	Object.defineProperty(api, 'AUDIO_SPEAKER', {
		get: function(){return _AUDIO_SPEAKER;},
		set: function(val){return _AUDIO_SPEAKER = val;}
	});

	var _AUDIO_UNAVAILABLE = null;
	Object.defineProperty(api, 'AUDIO_UNAVAILABLE', {
		get: function(){return _AUDIO_UNAVAILABLE;},
		set: function(val){return _AUDIO_UNAVAILABLE = val;}
	});

	var _AUDIO_UNKNOWN = null;
	Object.defineProperty(api, 'AUDIO_UNKNOWN', {
		get: function(){return _AUDIO_UNKNOWN;},
		set: function(val){return _AUDIO_UNKNOWN = val;}
	});

	var _DEVICE_BUSY = null;
	Object.defineProperty(api, 'DEVICE_BUSY', {
		get: function(){return _DEVICE_BUSY;},
		set: function(val){return _DEVICE_BUSY = val;}
	});

	var _MEDIA_TYPE_PHOTO = null;
	Object.defineProperty(api, 'MEDIA_TYPE_PHOTO', {
		get: function(){return _MEDIA_TYPE_PHOTO;},
		set: function(val){return _MEDIA_TYPE_PHOTO = val;}
	});

	var _MEDIA_TYPE_VIDEO = null;
	Object.defineProperty(api, 'MEDIA_TYPE_VIDEO', {
		get: function(){return _MEDIA_TYPE_VIDEO;},
		set: function(val){return _MEDIA_TYPE_VIDEO = val;}
	});

	var _MUSIC_MEDIA_TYPE_ALL = null;
	Object.defineProperty(api, 'MUSIC_MEDIA_TYPE_ALL', {
		get: function(){return _MUSIC_MEDIA_TYPE_ALL;},
		set: function(val){return _MUSIC_MEDIA_TYPE_ALL = val;}
	});

	var _MUSIC_MEDIA_TYPE_ANY_AUDIO = null;
	Object.defineProperty(api, 'MUSIC_MEDIA_TYPE_ANY_AUDIO', {
		get: function(){return _MUSIC_MEDIA_TYPE_ANY_AUDIO;},
		set: function(val){return _MUSIC_MEDIA_TYPE_ANY_AUDIO = val;}
	});

	var _MUSIC_MEDIA_TYPE_AUDIOBOOK = null;
	Object.defineProperty(api, 'MUSIC_MEDIA_TYPE_AUDIOBOOK', {
		get: function(){return _MUSIC_MEDIA_TYPE_AUDIOBOOK;},
		set: function(val){return _MUSIC_MEDIA_TYPE_AUDIOBOOK = val;}
	});

	var _MUSIC_MEDIA_TYPE_MUSIC = null;
	Object.defineProperty(api, 'MUSIC_MEDIA_TYPE_MUSIC', {
		get: function(){return _MUSIC_MEDIA_TYPE_MUSIC;},
		set: function(val){return _MUSIC_MEDIA_TYPE_MUSIC = val;}
	});

	var _MUSIC_MEDIA_TYPE_PODCAST = null;
	Object.defineProperty(api, 'MUSIC_MEDIA_TYPE_PODCAST', {
		get: function(){return _MUSIC_MEDIA_TYPE_PODCAST;},
		set: function(val){return _MUSIC_MEDIA_TYPE_PODCAST = val;}
	});

	var _MUSIC_PLAYER_REPEAT_ALL = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_REPEAT_ALL', {
		get: function(){return _MUSIC_PLAYER_REPEAT_ALL;},
		set: function(val){return _MUSIC_PLAYER_REPEAT_ALL = val;}
	});

	var _MUSIC_PLAYER_REPEAT_DEFAULT = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_REPEAT_DEFAULT', {
		get: function(){return _MUSIC_PLAYER_REPEAT_DEFAULT;},
		set: function(val){return _MUSIC_PLAYER_REPEAT_DEFAULT = val;}
	});

	var _MUSIC_PLAYER_REPEAT_NONE = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_REPEAT_NONE', {
		get: function(){return _MUSIC_PLAYER_REPEAT_NONE;},
		set: function(val){return _MUSIC_PLAYER_REPEAT_NONE = val;}
	});

	var _MUSIC_PLAYER_REPEAT_ONE = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_REPEAT_ONE', {
		get: function(){return _MUSIC_PLAYER_REPEAT_ONE;},
		set: function(val){return _MUSIC_PLAYER_REPEAT_ONE = val;}
	});

	var _MUSIC_PLAYER_SHUFFLE_ALBUMS = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_SHUFFLE_ALBUMS', {
		get: function(){return _MUSIC_PLAYER_SHUFFLE_ALBUMS;},
		set: function(val){return _MUSIC_PLAYER_SHUFFLE_ALBUMS = val;}
	});

	var _MUSIC_PLAYER_SHUFFLE_DEFAULT = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_SHUFFLE_DEFAULT', {
		get: function(){return _MUSIC_PLAYER_SHUFFLE_DEFAULT;},
		set: function(val){return _MUSIC_PLAYER_SHUFFLE_DEFAULT = val;}
	});

	var _MUSIC_PLAYER_SHUFFLE_NONE = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_SHUFFLE_NONE', {
		get: function(){return _MUSIC_PLAYER_SHUFFLE_NONE;},
		set: function(val){return _MUSIC_PLAYER_SHUFFLE_NONE = val;}
	});

	var _MUSIC_PLAYER_SHUFFLE_SONGS = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_SHUFFLE_SONGS', {
		get: function(){return _MUSIC_PLAYER_SHUFFLE_SONGS;},
		set: function(val){return _MUSIC_PLAYER_SHUFFLE_SONGS = val;}
	});

	var _MUSIC_PLAYER_STATE_INTERRUPTED = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_INTERRUPTED', {
		get: function(){return _MUSIC_PLAYER_STATE_INTERRUPTED;},
		set: function(val){return _MUSIC_PLAYER_STATE_INTERRUPTED = val;}
	});

	var _MUSIC_PLAYER_STATE_PAUSED = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_PAUSED', {
		get: function(){return _MUSIC_PLAYER_STATE_PAUSED;},
		set: function(val){return _MUSIC_PLAYER_STATE_PAUSED = val;}
	});

	var _MUSIC_PLAYER_STATE_PLAYING = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_PLAYING', {
		get: function(){return _MUSIC_PLAYER_STATE_PLAYING;},
		set: function(val){return _MUSIC_PLAYER_STATE_PLAYING = val;}
	});

	var _MUSIC_PLAYER_STATE_SEEK_BACKWARD = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_SEEK_BACKWARD', {
		get: function(){return _MUSIC_PLAYER_STATE_SEEK_BACKWARD;},
		set: function(val){return _MUSIC_PLAYER_STATE_SEEK_BACKWARD = val;}
	});

	var _MUSIC_PLAYER_STATE_SKEEK_FORWARD = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_SKEEK_FORWARD', {
		get: function(){return _MUSIC_PLAYER_STATE_SKEEK_FORWARD;},
		set: function(val){return _MUSIC_PLAYER_STATE_SKEEK_FORWARD = val;}
	});

	var _MUSIC_PLAYER_STATE_STOPPED = null;
	Object.defineProperty(api, 'MUSIC_PLAYER_STATE_STOPPED', {
		get: function(){return _MUSIC_PLAYER_STATE_STOPPED;},
		set: function(val){return _MUSIC_PLAYER_STATE_STOPPED = val;}
	});

	var _NO_CAMERA = null;
	Object.defineProperty(api, 'NO_CAMERA', {
		get: function(){return _NO_CAMERA;},
		set: function(val){return _NO_CAMERA = val;}
	});

	var _NO_VIDEO = null;
	Object.defineProperty(api, 'NO_VIDEO', {
		get: function(){return _NO_VIDEO;},
		set: function(val){return _NO_VIDEO = val;}
	});

	var _QUALITY_HIGH = null;
	Object.defineProperty(api, 'QUALITY_HIGH', {
		get: function(){return _QUALITY_HIGH;},
		set: function(val){return _QUALITY_HIGH = val;}
	});

	var _QUALITY_LOW = null;
	Object.defineProperty(api, 'QUALITY_LOW', {
		get: function(){return _QUALITY_LOW;},
		set: function(val){return _QUALITY_LOW = val;}
	});

	var _QUALITY_MEDIUM = null;
	Object.defineProperty(api, 'QUALITY_MEDIUM', {
		get: function(){return _QUALITY_MEDIUM;},
		set: function(val){return _QUALITY_MEDIUM = val;}
	});

	var _UNKNOWN_ERROR = null;
	Object.defineProperty(api, 'UNKNOWN_ERROR', {
		get: function(){return _UNKNOWN_ERROR;},
		set: function(val){return _UNKNOWN_ERROR = val;}
	});

	var _VIDEO_CONTROL_DEFAULT = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_DEFAULT', {
		get: function(){return _VIDEO_CONTROL_DEFAULT;},
		set: function(val){return _VIDEO_CONTROL_DEFAULT = val;}
	});

	var _VIDEO_CONTROL_EMBEDDED = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_EMBEDDED', {
		get: function(){return _VIDEO_CONTROL_EMBEDDED;},
		set: function(val){return _VIDEO_CONTROL_EMBEDDED = val;}
	});

	var _VIDEO_CONTROL_FULLSCREEN = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_FULLSCREEN', {
		get: function(){return _VIDEO_CONTROL_FULLSCREEN;},
		set: function(val){return _VIDEO_CONTROL_FULLSCREEN = val;}
	});

	var _VIDEO_CONTROL_HIDDEN = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_HIDDEN', {
		get: function(){return _VIDEO_CONTROL_HIDDEN;},
		set: function(val){return _VIDEO_CONTROL_HIDDEN = val;}
	});

	var _VIDEO_CONTROL_NONE = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_NONE', {
		get: function(){return _VIDEO_CONTROL_NONE;},
		set: function(val){return _VIDEO_CONTROL_NONE = val;}
	});

	var _VIDEO_CONTROL_VOLUME_ONLY = null;
	Object.defineProperty(api, 'VIDEO_CONTROL_VOLUME_ONLY', {
		get: function(){return _VIDEO_CONTROL_VOLUME_ONLY;},
		set: function(val){return _VIDEO_CONTROL_VOLUME_ONLY = val;}
	});

	var _VIDEO_FINISH_REASON_PLAYBACK_ENDED = null;
	Object.defineProperty(api, 'VIDEO_FINISH_REASON_PLAYBACK_ENDED', {
		get: function(){return _VIDEO_FINISH_REASON_PLAYBACK_ENDED;},
		set: function(val){return _VIDEO_FINISH_REASON_PLAYBACK_ENDED = val;}
	});

	var _VIDEO_FINISH_REASON_PLAYBACK_ERROR = null;
	Object.defineProperty(api, 'VIDEO_FINISH_REASON_PLAYBACK_ERROR', {
		get: function(){return _VIDEO_FINISH_REASON_PLAYBACK_ERROR;},
		set: function(val){return _VIDEO_FINISH_REASON_PLAYBACK_ERROR = val;}
	});

	var _VIDEO_FINISH_REASON_USER_EXITED = null;
	Object.defineProperty(api, 'VIDEO_FINISH_REASON_USER_EXITED', {
		get: function(){return _VIDEO_FINISH_REASON_USER_EXITED;},
		set: function(val){return _VIDEO_FINISH_REASON_USER_EXITED = val;}
	});

	var _VIDEO_LOAD_STATE_PLAYABLE = null;
	Object.defineProperty(api, 'VIDEO_LOAD_STATE_PLAYABLE', {
		get: function(){return _VIDEO_LOAD_STATE_PLAYABLE;},
		set: function(val){return _VIDEO_LOAD_STATE_PLAYABLE = val;}
	});

	var _VIDEO_LOAD_STATE_PLAYTHROUGH_OK = null;
	Object.defineProperty(api, 'VIDEO_LOAD_STATE_PLAYTHROUGH_OK', {
		get: function(){return _VIDEO_LOAD_STATE_PLAYTHROUGH_OK;},
		set: function(val){return _VIDEO_LOAD_STATE_PLAYTHROUGH_OK = val;}
	});

	var _VIDEO_LOAD_STATE_STALLED = null;
	Object.defineProperty(api, 'VIDEO_LOAD_STATE_STALLED', {
		get: function(){return _VIDEO_LOAD_STATE_STALLED;},
		set: function(val){return _VIDEO_LOAD_STATE_STALLED = val;}
	});

	var _VIDEO_LOAD_STATE_UNKNOWN = null;
	Object.defineProperty(api, 'VIDEO_LOAD_STATE_UNKNOWN', {
		get: function(){return _VIDEO_LOAD_STATE_UNKNOWN;},
		set: function(val){return _VIDEO_LOAD_STATE_UNKNOWN = val;}
	});

	var _VIDEO_MEDIA_TYPE_AUDIO = null;
	Object.defineProperty(api, 'VIDEO_MEDIA_TYPE_AUDIO', {
		get: function(){return _VIDEO_MEDIA_TYPE_AUDIO;},
		set: function(val){return _VIDEO_MEDIA_TYPE_AUDIO = val;}
	});

	var _VIDEO_MEDIA_TYPE_NONE = null;
	Object.defineProperty(api, 'VIDEO_MEDIA_TYPE_NONE', {
		get: function(){return _VIDEO_MEDIA_TYPE_NONE;},
		set: function(val){return _VIDEO_MEDIA_TYPE_NONE = val;}
	});

	var _VIDEO_MEDIA_TYPE_VIDEO = null;
	Object.defineProperty(api, 'VIDEO_MEDIA_TYPE_VIDEO', {
		get: function(){return _VIDEO_MEDIA_TYPE_VIDEO;},
		set: function(val){return _VIDEO_MEDIA_TYPE_VIDEO = val;}
	});

	var _VIDEO_PLAYBACK_STATE_INTERRUPTED = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_INTERRUPTED', {
		get: function(){return _VIDEO_PLAYBACK_STATE_INTERRUPTED;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_INTERRUPTED = val;}
	});

	var _VIDEO_PLAYBACK_STATE_PAUSED = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_PAUSED', {
		get: function(){return _VIDEO_PLAYBACK_STATE_PAUSED;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_PAUSED = val;}
	});

	var _VIDEO_PLAYBACK_STATE_PLAYING = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_PLAYING', {
		get: function(){return _VIDEO_PLAYBACK_STATE_PLAYING;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_PLAYING = val;}
	});

	var _VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD', {
		get: function(){return _VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD = val;}
	});

	var _VIDEO_PLAYBACK_STATE_SEEKING_FORWARD = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_SEEKING_FORWARD', {
		get: function(){return _VIDEO_PLAYBACK_STATE_SEEKING_FORWARD;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_SEEKING_FORWARD = val;}
	});

	var _VIDEO_PLAYBACK_STATE_STOPPED = null;
	Object.defineProperty(api, 'VIDEO_PLAYBACK_STATE_STOPPED', {
		get: function(){return _VIDEO_PLAYBACK_STATE_STOPPED;},
		set: function(val){return _VIDEO_PLAYBACK_STATE_STOPPED = val;}
	});

	var _VIDEO_REPEAT_MODE_NONE = null;
	Object.defineProperty(api, 'VIDEO_REPEAT_MODE_NONE', {
		get: function(){return _VIDEO_REPEAT_MODE_NONE;},
		set: function(val){return _VIDEO_REPEAT_MODE_NONE = val;}
	});

	var _VIDEO_REPEAT_MODE_ONE = null;
	Object.defineProperty(api, 'VIDEO_REPEAT_MODE_ONE', {
		get: function(){return _VIDEO_REPEAT_MODE_ONE;},
		set: function(val){return _VIDEO_REPEAT_MODE_ONE = val;}
	});

	var _VIDEO_SCALING_ASPECT_FILL = null;
	Object.defineProperty(api, 'VIDEO_SCALING_ASPECT_FILL', {
		get: function(){return _VIDEO_SCALING_ASPECT_FILL;},
		set: function(val){return _VIDEO_SCALING_ASPECT_FILL = val;}
	});

	var _VIDEO_SCALING_ASPECT_FIT = null;
	Object.defineProperty(api, 'VIDEO_SCALING_ASPECT_FIT', {
		get: function(){return _VIDEO_SCALING_ASPECT_FIT;},
		set: function(val){return _VIDEO_SCALING_ASPECT_FIT = val;}
	});

	var _VIDEO_SCALING_MODE_FILL = null;
	Object.defineProperty(api, 'VIDEO_SCALING_MODE_FILL', {
		get: function(){return _VIDEO_SCALING_MODE_FILL;},
		set: function(val){return _VIDEO_SCALING_MODE_FILL = val;}
	});

	var _VIDEO_SCALING_NONE = null;
	Object.defineProperty(api, 'VIDEO_SCALING_NONE', {
		get: function(){return _VIDEO_SCALING_NONE;},
		set: function(val){return _VIDEO_SCALING_NONE = val;}
	});

	var _VIDEO_SOURCE_TYPE_FILE = null;
	Object.defineProperty(api, 'VIDEO_SOURCE_TYPE_FILE', {
		get: function(){return _VIDEO_SOURCE_TYPE_FILE;},
		set: function(val){return _VIDEO_SOURCE_TYPE_FILE = val;}
	});

	var _VIDEO_SOURCE_TYPE_STREAMING = null;
	Object.defineProperty(api, 'VIDEO_SOURCE_TYPE_STREAMING', {
		get: function(){return _VIDEO_SOURCE_TYPE_STREAMING;},
		set: function(val){return _VIDEO_SOURCE_TYPE_STREAMING = val;}
	});

	var _VIDEO_SOURCE_TYPE_UNKNOWN = null;
	Object.defineProperty(api, 'VIDEO_SOURCE_TYPE_UNKNOWN', {
		get: function(){return _VIDEO_SOURCE_TYPE_UNKNOWN;},
		set: function(val){return _VIDEO_SOURCE_TYPE_UNKNOWN = val;}
	});

	var _VIDEO_TIME_OPTION_EXACT = null;
	Object.defineProperty(api, 'VIDEO_TIME_OPTION_EXACT', {
		get: function(){return _VIDEO_TIME_OPTION_EXACT;},
		set: function(val){return _VIDEO_TIME_OPTION_EXACT = val;}
	});

	var _VIDEO_TIME_OPTION_NEAREST_KEYFRAME = null;
	Object.defineProperty(api, 'VIDEO_TIME_OPTION_NEAREST_KEYFRAME', {
		get: function(){return _VIDEO_TIME_OPTION_NEAREST_KEYFRAME;},
		set: function(val){return _VIDEO_TIME_OPTION_NEAREST_KEYFRAME = val;}
	});

	var _appMusicPlayer = null;
	Object.defineProperty(api, 'appMusicPlayer', {
		get: function(){return _appMusicPlayer;},
		set: function(val){return _appMusicPlayer = val;}
	});

	var _audioLineType = null;
	Object.defineProperty(api, 'audioLineType', {
		get: function(){return _audioLineType;},
		set: function(val){return _audioLineType = val;}
	});

	var _audioPlaying = null;
	Object.defineProperty(api, 'audioPlaying', {
		get: function(){return _audioPlaying;},
		set: function(val){return _audioPlaying = val;}
	});

	var _audioSessionMode = null;
	Object.defineProperty(api, 'audioSessionMode', {
		get: function(){return _audioSessionMode;},
		set: function(val){return _audioSessionMode = val;}
	});

	var _availableCameraMediaTypes = null;
	Object.defineProperty(api, 'availableCameraMediaTypes', {
		get: function(){return _availableCameraMediaTypes;},
		set: function(val){return _availableCameraMediaTypes = val;}
	});

	var _availablePhotoGalleryMediaTypes = null;
	Object.defineProperty(api, 'availablePhotoGalleryMediaTypes', {
		get: function(){return _availablePhotoGalleryMediaTypes;},
		set: function(val){return _availablePhotoGalleryMediaTypes = val;}
	});

	var _availablePhotoMediaTypes = null;
	Object.defineProperty(api, 'availablePhotoMediaTypes', {
		get: function(){return _availablePhotoMediaTypes;},
		set: function(val){return _availablePhotoMediaTypes = val;}
	});

	var _averageMicrophonePower = null;
	Object.defineProperty(api, 'averageMicrophonePower', {
		get: function(){return _averageMicrophonePower;},
		set: function(val){return _averageMicrophonePower = val;}
	});

	var _canRecord = null;
	Object.defineProperty(api, 'canRecord', {
		get: function(){return _canRecord;},
		set: function(val){return _canRecord = val;}
	});

	var _isCameraSupported = null;
	Object.defineProperty(api, 'isCameraSupported', {
		get: function(){return _isCameraSupported;},
		set: function(val){return _isCameraSupported = val;}
	});

	var _peakMicrophonePower = null;
	Object.defineProperty(api, 'peakMicrophonePower', {
		get: function(){return _peakMicrophonePower;},
		set: function(val){return _peakMicrophonePower = val;}
	});

	var _systemMusicPlayer = null;
	Object.defineProperty(api, 'systemMusicPlayer', {
		get: function(){return _systemMusicPlayer;},
		set: function(val){return _systemMusicPlayer = val;}
	});

	var _volume = null;
	Object.defineProperty(api, 'volume', {
		get: function(){return _volume;},
		set: function(val){return _volume = val;}
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