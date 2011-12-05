Ti._5.createClass('Titanium.Media.VideoPlayer', function(api){
    var obj = this;
	// Interfaces
	Ti._5.DOMView(this, 'div', args, 'VideoPlayer');
	Ti._5.Touchable(this);
	Ti._5.Styleable(this, args);
	Ti._5.Positionable(this, args);

	// Properties
	Ti._5.prop(this, 'autoplay');

	Ti._5.prop(this, 'contentURL');

	Ti._5.prop(this, 'duration');

	Ti._5.prop(this, 'endPlaybackTime');

	Ti._5.prop(this, 'fullscreen');

	Ti._5.prop(this, 'initialPlaybackTime');

	Ti._5.prop(this, 'loadState');

	Ti._5.prop(this, 'media');

	Ti._5.prop(this, 'mediaControlStyle');

	Ti._5.prop(this, 'mediaTypes');

	Ti._5.prop(this, 'movieControlMode');

	Ti._5.prop(this, 'naturalSize');

	Ti._5.prop(this, 'playableDuration');

	Ti._5.prop(this, 'playbackState');

	Ti._5.prop(this, 'playing');

	Ti._5.prop(this, 'repeatMode');

	Ti._5.prop(this, 'scalingMode');

	Ti._5.prop(this, 'sourceType');

	Ti._5.prop(this, 'url');

	Ti._5.prop(this, 'useApplicationAudioSession');

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