/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Titanium.mediaProxy = window.TitaniumMedia;

var Sound = function(proxy) {
	this.proxy = proxy;

	/**
	 * @tiapi(method=True,name=Media.Sound.play,since=0.4) Start the sound playing.
	 */
	this.play = function() {
		this.proxy.play();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.pause,since=0.4) Pause a playing sound.
	 */
	this.pause = function() {
		this.proxy.pause();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.stop,since=0.4) Stop the sound and reset to the beginning.
	 */
	this.stop = function() {
		this.proxy.stop();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.reset,since=0.4) Reset sound to the beginning.
	 */
	this.reset = function() {
		this.proxy.reset();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.release,since=0.4) Release native resources associated with this Sound object.
	 * @tiapi This should release a Sound object as soon as you are finished with it.
	 */
	this.release = function() {
		this.proxy.release();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.setVolume,since=0.4) Set volume for this Sound.
	 * @tiarg[double,v] value between 0.0 and 1.0
	 */
	this.setVolume = function(v) {
		this.proxy.setVolume(v);
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.getVolume,since=0.4)
	 * @tiresult[double] current level for this Sound.
	 */
	this.getVolume = function() {
		return this.proxy.getVolume();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.setLooping,since=0.4)
	 * @tiarg[bool,loop] if true, Sound will loop until stopped.
	 */
	this.setLooping = function(loop) {
		this.proxy.setLooping(loop);
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.isLooping,since=0.4)
	 * @tiresult[bool] true, if the Sound is current set to loop.
	 */
	this.isLooping = function() {
		return this.proxy.isLooping();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.isPlaying,since=0.4)
	 * @tiresult[bool] true, if the Sound is currently playing.
	 */
	this.isPlaying = function() {
		return this.proxy.isPlaying();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.isPaused,since=0.4)
	 * @tiresult[bool] true if the sound is currently paused.
	 */
	this.isPaused = function() {
		return this.proxy.isPaused();
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.addEventListener,since=0.4) Add event listener, currently supports 'complete' and 'error' events.
	 * @tiarg[string,eventName] Name of event.
	 * @tiarg[function,listener] listener for the event in eventName
	 * @tiresult[int] id to pass to removeEventListener to stop receiving events.
	 */
	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	/**
	 * @tiapi(method=True,name=Media.Sound.removeEventListener,since=0.4)
	 * @tiapi[string,eventName] name of event
	 * @tiapi[int,listenerId] Id returned from addEventListener for this eventName
	 */
	this.removeEventListener = function(eventName, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
};

var Video = function(proxy) {
	this.proxy = proxy;
	this.errorId = -1;
	this.completeId = -1;

	/**
	 * @tiapi(method=True,name=Media.Video.play,since=0.4) play the video
	 */
	this.play = function() {
		this.proxy.play();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.pause,since=0.4)
	 */
	this.pause = function() {
		this.proxy.pause();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.stop,since=0.4)
	 */
	this.stop = function() {
		this.proxy.stop();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.reset,since=0.4)
	 */
	this.reset = function() {
		this.proxy.reset();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.release,since=0.4)
	 */
	this.release = function() {
		if (this.errorId != -1) {
			this.proxy.removeListener("error", this.errorId);
			this.errorId = -1;
		}
		if (this.completeId != -1) {
			this.proxy.removeListener("complete", this.completeId);
			this.completeId = -1;
		}
		this.proxy.release();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.isPlaying,since=0.4)
	 */
	this.isPlaying = function() {
		return this.proxy.isPlaying();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.isPaused,since=0.4)
	 */
	this.isPaused = function() {
		return this.proxy.isPaused();
	};
	/**
	 * @tiapi(method=True,name=Media.Video.addEventListener,since=0.4)
	 */
	this.addEventListener = function(eventName, listener) {
		return this.proxy.addEventListener(eventName, registerCallback(this, listener));
	};
	/**
	 * @tiapi(method=True,name=Media.Video.removeEventListener,since=0.4)
	 */
	this.removeEventListener = function(eventName, listenerId) {
		this.proxy.removeEventListener(eventName, listenerId);
	};
};

Titanium.Media = {
	/**
	 * @tiapi(method=True,name=Media.beep,since=0.4) Play an audio alert using the system default notification.
	 */
	beep : function() {
		Titanium.mediaProxy.beep();
	},
	/**
	 * @tiapi(method=True,name=Media.createSound,since=0.4) Creates a Sound object.
	 * @tiarg[string,url] url to sound
	 * @tiresult[Sound] the sound object
	 */
	createSound : function(url) {
		return new Sound(Titanium.mediaProxy.createSound(url));
	},
	/**
	 * @tiapi(method=True,name=Media.vibrate,since=0.4) Vibrate the device
	 */
	vibrate : function() {
		Titanium.mediaProxy.vibrate(null);
	},
	/**
	 * @tiapi(method=True,name=Media.showCamera,since=0.4) Start the camera for capturing an image.
	 * @tiarg[object,options] hash/dictionary for camera options.
	 */
	showCamera : function(options) {
		var userSuccess = transformObjectValue(options.success, function(){});
		var userCancel = transformObjectValue(options.cancel, function(){});
		var userError = transformObjectValue(options.error, function(){});

		var blob = Titanium.mediaProxy.createBlob();

		var success = registerCallback(this, function(attrs) {
				var b = TitaniumFile.createBlob(blob);
				b.width = attrs.w;
				b.height = attrs.h;
				userSuccess(b);
			});
		var cancel = registerCallback(this, function() { blob = null; userCancel();});
		var error = registerCallback(this, function(err) { blob = null; userError(err);});

		var args = {
			saveToPhotoGallery : options.saveToPhotoGallery
		};

		Titanium.mediaProxy.showCamera(success, cancel, error, Titanium.JSON.stringify(args), blob); // TODO handle one-off callbacks
	},
	/**
	 * @tiapi(method=True,name=Media.openPhotoGallery,since=0.4) Show a photo browser. On Android the browser allows editing.
	 * @[object,options] hash/dictionary of for configuring the photo gallery.
	 */
	openPhotoGallery  : function(options) {
		var userSuccess = transformObjectValue(options.success, function(){});
		var userCancel = transformObjectValue(options.cancel, function(){});
		var userError = transformObjectValue(options.error, function(){});

		var blob = Titanium.mediaProxy.createBlob();

		var success = registerCallback(this, function(attrs) {
			var b = TitaniumFile.createBlob(blob);
			b.width = attrs.w;
			b.height = attrs.h;
			userSuccess(b);
			});
		var cancel = registerCallback(this, function() { blob = null; userCancel();});
		var error = registerCallback(this, function(err) { blob = null; userError(err);});
		Titanium.mediaProxy.openPhotoGallery(success, cancel, error, blob); // TODO handle one-off callbacks
	},
	/**
	 * @tiapi(method=True,name=Media.previewImage,since=0.4) Start the photo gallery on a specific image.
	 * @tiarg[object,options] hash/dictionary of viewing options.
	 */
	previewImage  : function(options) {
		var success = registerCallback(this, transformObjectValue(options.success, function(){}));
		var error = registerCallback(this, transformObjectValue(options.error, function(){}));
		var img = options.image;

		// This step is required. If you use img.obj to get the native object
		// it's valid in this context and gets set to null on the way to previewImage.
		// I think it's an android bug, but not sure.
		var blob = Titanium.mediaProxy.createBlob();
		blob.setUrl(img.url);

		Titanium.mediaProxy.previewImage(success, error, blob); // TODO handle one-off callbacks
	},
	/**
	 * @tiapi(method=True,name=Media.createVideoPlayer,since=0.4) Start video player
	 * @tiarg[object,options] hash/dictionary of video player options.
	 */
	createVideoPlayer : function(options) {
		var player = null;
		if (!isUndefined(options)) {
			var proxy = Titanium.mediaProxy.createVideoPlayer(Titanium.JSON.stringify(options));
			if (proxy !== null) {
				player = new Video(proxy);
				if (!isUndefined(options.complete)) {
					player.completeId = addEventListener("complete", registerCallback(this, options.complete));
				}
				if (!isUndefined(options.error)) {
					player.errorId = addEventListener("error", registerCallback(this, options.error));
				}
			}
		}
		return player;
	},
	//iPhone
	saveToPhotoGallery : function() {

	}
};
