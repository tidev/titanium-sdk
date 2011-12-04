Ti._5.createClass("Titanium.Media.VideoPlayer", function(args){
	args = args || {};

	var self = this,
		video = document.createElement("video"),
		supportsFullscreen = (function(s){ return !s || s(); }(video.webkitSupportsFullscreen));

	// Interfaces
	Ti._5.DOMView(self, "div", args, "VideoPlayer");
	Ti._5.Touchable(self);
	Ti._5.Styleable(self, args);
	Ti._5.EventDriven(self);
	Ti._5.Positionable(self, args);

	// Properties
	self.autoplay = !!args.autoplay;
	self.mediaControlStyle = Ti.Media.VIDEO_CONTROL_NONE;
	self.playbackState = Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED;
	self.playing = false;
	self.duration = self.endPlaybackTime = 0;
	self.loadState = Ti.Media.VIDEO_LOAD_STATE_UNKNOWN;
	self.repeatMode = args.repeatMode || Ti.Media.VIDEO_REPEAT_MODE_NONE;

	var _fullscreen = (function(s){ return args.fullscreen || s && s(); }(video.webkitDisplayingFullscreen));
	Object.defineProperty(self, "fullscreen", {
		get: function(){ return _fullscreen; },
		set: function(fs){
			_fullscreen = !!fs;

			if (supportsFullscreen) {
				try {
					if (_fullscreen) {
						video.webkitEnterFullscreen();
					} else {
						video.webkitExitFullscreen();
					}
				} catch(ex) {}
			} else {
				// TODO: fake fullscreen
			}

			self.fireEvent("fullscreen", {
				entering: _fullscreen,
				source: self
			});
		}
	});

	var _initialPlaybackTime = null;
	Object.defineProperty(self, "initialPlaybackTime", {
		get: function(){return _initialPlaybackTime;},
		set: function(val){return _initialPlaybackTime = val;}
	});

	var _playableDuration = null;
	Object.defineProperty(self, "playableDuration", {
		get: function(){return _playableDuration;},
		set: function(val){return _playableDuration = val;}
	});

	var _scalingMode = Ti.Media.VIDEO_SCALING_ASPECT_FIT;
	Object.defineProperty(self, "scalingMode", {
		get: function() {
			return _scalingMode;
		},
		set: function(val) {
			return setSize(_scalingMode = val);
		}
	});

	var _url = args.url;
	Object.defineProperty(self, "url", {
		get: function() { return _url; },
		set: function(val) {
			_url = val;
			createVideo();
			return val;
		}
	});

	function setSize(val) {
		switch (val) {
			case Ti.Media.VIDEO_SCALING_NONE:
				break;
			case Ti.Media.VIDEO_SCALING_MODE_FIT:
				break;
			case Ti.Media.VIDEO_SCALING_ASPECT_FILL:
				break;
			default: // VIDEO_SCALING_ASPECT_FIT
		}
		return val;
	}

	function createVideo() {
		var d = self.dom,
			p = video.parentNode;
		p && p.removeChild(video);
		video = document.createElement("video");
		video.id = "myvid";
		video.style.position = "absolute";
		video.style.left = "0px";
		video.style.top = "0px";
		video.style.width = "100%";
		video.style.height = "100%";
		self.autoplay && (video.autoplay = true);
console.debug(self.repeatMode, Ti.Media.VIDEO_REPEAT_MODE_ONE);
		self.repeatMode === Ti.Media.VIDEO_REPEAT_MODE_ONE && (video.loop = true);
		d.appendChild(video);
		video.src = self.url;
	}

	// Methods
	self.pause = function(){
		video.pause();
	};
	self.play = function(){
		video.play();
	};
	self.release = function(){
		// do anything?
	};
	self.setUrl = function(url){
		self.url = url;
	};
	self.stop = function(){
		video.pause();
		video.currentTime = 0;
	};

	// Events
	function setPlaybackState(state) {
		self.fireEvent("playbackState", {
			playbackState: self.playbackState = state,
			source: self
		});
	}

	function setLoadState(ls) {
		self.fireEvent("loadstate", {
			loadState: self.loadState = ls,
			source: self
		});
	}

	video.addEventListener("play", function () {
		self.playing = true;
		setPlaybackState(Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING);
	}, false);

	video.addEventListener("pause", function () {
		self.playing = false;
		setPlaybackState(this.currentTime == 0 ? Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED : Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED);
	}, false);

	video.addEventListener("canplay", function () {
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_PLAYABLE);
	}, false);

	video.addEventListener("canplaythrough", function () {
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK);
		self.fireEvent("preload", {
			source: self
		});
	}, false);

	video.addEventListener("loadeddata", function () {
		self.fireEvent("load", {
			source: self
		});
	}, false);

	video.addEventListener("durationChange", function () {
		if (!self.duration && this.duration) {
			self.fireEvent("durationAvailable", {
				duration: this.duration,
				source: self
			});
		}
		self.duration = this.duration;
	}, false);

	video.addEventListener("error", function () {
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_UNKNOWN);
		self.fireEvent("error", {
			message: this.error,
			source: self
		});
	}, false);

	video.addEventListener("suspend", function () {
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_UNKNOWN);
	}, false);

	function complete(evt) {
		self.fireEvent("complete", {
			reason: evt.type,
			source: self
		});
	}
	video.addEventListener("abort", complete, false);
	video.addEventListener("ended", complete, false);

	function stalled() {
		setLoadState(Ti.Media.VIDEO_LOAD_STATE_STALLED);
	}
	video.addEventListener("stalled", stalled, false);
	video.addEventListener("waiting", stalled, false);

	// if we have a url, then create the video
	self.url && createVideo();
});