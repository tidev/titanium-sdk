Ti._5.createClass('Titanium.Media.VideoPlayer', function(api){
    var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'VideoPlayer');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	var _autoplay = null;
	Object.defineProperty(this, 'autoplay', {
		get: function(){return _autoplay;},
		set: function(val){return _autoplay = val;}
	});

	var _contentURL = null;
	Object.defineProperty(this, 'contentURL', {
		get: function(){return _contentURL;},
		set: function(val){return _contentURL = val;}
	});

	var _duration = null;
	Object.defineProperty(this, 'duration', {
		get: function(){return _duration;},
		set: function(val){return _duration = val;}
	});

	var _endPlaybackTime = null;
	Object.defineProperty(this, 'endPlaybackTime', {
		get: function(){return _endPlaybackTime;},
		set: function(val){return _endPlaybackTime = val;}
	});

	var _fullscreen = null;
	Object.defineProperty(this, 'fullscreen', {
		get: function(){return _fullscreen;},
		set: function(val){return _fullscreen = val;}
	});

	var _initialPlaybackTime = null;
	Object.defineProperty(this, 'initialPlaybackTime', {
		get: function(){return _initialPlaybackTime;},
		set: function(val){return _initialPlaybackTime = val;}
	});

	var _loadState = null;
	Object.defineProperty(this, 'loadState', {
		get: function(){return _loadState;},
		set: function(val){return _loadState = val;}
	});

	var _media = null;
	Object.defineProperty(this, 'media', {
		get: function(){return _media;},
		set: function(val){return _media = val;}
	});

	var _mediaControlStyle = null;
	Object.defineProperty(this, 'mediaControlStyle', {
		get: function(){return _mediaControlStyle;},
		set: function(val){return _mediaControlStyle = val;}
	});

	var _mediaTypes = null;
	Object.defineProperty(this, 'mediaTypes', {
		get: function(){return _mediaTypes;},
		set: function(val){return _mediaTypes = val;}
	});

	var _movieControlMode = null;
	Object.defineProperty(this, 'movieControlMode', {
		get: function(){return _movieControlMode;},
		set: function(val){return _movieControlMode = val;}
	});

	var _naturalSize = null;
	Object.defineProperty(this, 'naturalSize', {
		get: function(){return _naturalSize;},
		set: function(val){return _naturalSize = val;}
	});

	var _playableDuration = null;
	Object.defineProperty(this, 'playableDuration', {
		get: function(){return _playableDuration;},
		set: function(val){return _playableDuration = val;}
	});

	var _playbackState = null;
	Object.defineProperty(this, 'playbackState', {
		get: function(){return _playbackState;},
		set: function(val){return _playbackState = val;}
	});

	var _playing = null;
	Object.defineProperty(this, 'playing', {
		get: function(){return _playing;},
		set: function(val){return _playing = val;}
	});

	var _repeatMode = null;
	Object.defineProperty(this, 'repeatMode', {
		get: function(){return _repeatMode;},
		set: function(val){return _repeatMode = val;}
	});

	var _scalingMode = null;
	Object.defineProperty(this, 'scalingMode', {
		get: function(){return _scalingMode;},
		set: function(val){return _scalingMode = val;}
	});

	var _sourceType = null;
	Object.defineProperty(this, 'sourceType', {
		get: function(){return _sourceType;},
		set: function(val){return _sourceType = val;}
	});

	var _url = null;
	Object.defineProperty(this, 'url', {
		get: function(){return _url;},
		set: function(val){return _url = val;}
	});

	var _useApplicationAudioSession = null;
	Object.defineProperty(this, 'useApplicationAudioSession', {
		get: function(){return _useApplicationAudioSession;},
		set: function(val){return _useApplicationAudioSession = val;}
	});

	// Methods
	this.cancelAllThumbnailImageRequests = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.cancelAllThumbnailImageRequests" is not implemented yet.');
	};
	this.pause = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.pause" is not implemented yet.');
	};
	this.play = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.play" is not implemented yet.');
	};
	this.release = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.release" is not implemented yet.');
	};
	this.requestThumbnailImagesAtTimes = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.requestThumbnailImagesAtTimes" is not implemented yet.');
	};
	this.setBackgroundView = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.setBackgroundView" is not implemented yet.');
	};
	this.setMedia = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.setMedia" is not implemented yet.');
	};
	this.setUrl = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.setUrl" is not implemented yet.');
	};
	this.stop = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.stop" is not implemented yet.');
	};
	this.thumbnailImageAtTime = function(){
		console.debug('Method "Titanium.Media.VideoPlayer.thumbnailImageAtTime" is not implemented yet.');
	};

	// Events
	this.addEventListener('complete', function(){
		console.debug('Event "complete" is not implemented yet.');
	});
	this.addEventListener('durationAvailable', function(){
		console.debug('Event "durationAvailable" is not implemented yet.');
	});
	this.addEventListener('error', function(){
		console.debug('Event "error" is not implemented yet.');
	});
	this.addEventListener('fullscreen', function(){
		console.debug('Event "fullscreen" is not implemented yet.');
	});
	this.addEventListener('load', function(){
		console.debug('Event "load" is not implemented yet.');
	});
	this.addEventListener('loadstate', function(){
		console.debug('Event "loadstate" is not implemented yet.');
	});
	this.addEventListener('mediaTypesAvailable', function(){
		console.debug('Event "mediaTypesAvailable" is not implemented yet.');
	});
	this.addEventListener('naturalSizeAvailable', function(){
		console.debug('Event "naturalSizeAvailable" is not implemented yet.');
	});
	this.addEventListener('playbackState', function(){
		console.debug('Event "playbackState" is not implemented yet.');
	});
	this.addEventListener('playing', function(){
		console.debug('Event "playing" is not implemented yet.');
	});
	this.addEventListener('preload', function(){
		console.debug('Event "preload" is not implemented yet.');
	});
	this.addEventListener('resize', function(){
		console.debug('Event "resize" is not implemented yet.');
	});
	this.addEventListener('sourceChange', function(){
		console.debug('Event "sourceChange" is not implemented yet.');
	});
	this.addEventListener('thumbnail', function(){
		console.debug('Event "thumbnail" is not implemented yet.');
	});
});